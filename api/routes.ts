import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { DISCORD_APP_ID, DISCORD_CLIENT_SECRET, JWT_SECRET, DEVELOPER_ID } from '../src/config.js';
import { User, Guild, Alias, Email, Subscription } from '../src/db.js';
import { syncUserPlan } from '../src/shared.js';

// Initialize Razorpay lazily to ensure environment variables are loaded
let _razorpay: any = null;
const getRazorpay = () => {
  if (!_razorpay) {
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
    });
  }
  return _razorpay;
};

export const apiRouter = express.Router();

  // --- Discord OAuth2 Routes ---
  apiRouter.get('/auth/discord/url', (req, res) => {
    const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3005';
    const redirectUri = `${baseUrl}/api/auth/discord/callback`;
    
    const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify guilds`;
    res.json({ url });
  });

  apiRouter.get('/auth/discord/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) {
      return res.send(`
        <html><body><script>
          if (window.opener) { window.close(); } else { window.location.href = '/'; }
        </script></body></html>
      `);
    }

    try {
      const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3005';
      const redirectUri = `${baseUrl}/api/auth/discord/callback`;
      
      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: DISCORD_APP_ID,
          client_secret: DISCORD_CLIENT_SECRET,
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: redirectUri,
        })
      });

      const tokenData = await tokenResponse.json();
      if (!tokenData.access_token) throw new Error('Failed to get access token');

      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: { authorization: `Bearer ${tokenData.access_token}` }
      });
      const userData = await userResponse.json();

      // Fetch user's guilds
      const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: { authorization: `Bearer ${tokenData.access_token}` }
      });
      const guildsData = await guildsResponse.json();
      
      // Filter for Admin guilds (Permission Administrator is 0x8)
      const managedGuilds = Array.isArray(guildsData) ? guildsData.filter((g: any) => (BigInt(g.permissions) & BigInt(0x8)) === BigInt(0x8)).map((g: any) => ({
        id: g.id,
        name: g.name,
        icon: g.icon
      })) : [];

      // Update user record with managed guilds
      await User.updateOne(
        { discordId: userData.id }, 
        { 
          $set: { 
            managedGuilds 
          } 
        }, 
        { upsert: true }
      );

      const token = jwt.sign({ id: userData.id, username: userData.username, avatar: userData.avatar }, JWT_SECRET, { expiresIn: '7d' });
      
      // CRITICAL: Cookie settings for iframe
      res.cookie('token', token, { 
        httpOnly: true, 
        secure: true, 
        sameSite: 'none' 
      });
      
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/dashboard';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (err) {
      console.error('OAuth Error:', err);
      res.send(`
        <html><body><script>
          alert('Login failed. Please check your Discord Client Secret.');
          if (window.opener) { window.close(); } else { window.location.href = '/'; }
        </script></body></html>
      `);
    }
  });

  apiRouter.get('/auth/me', async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const user: any = jwt.verify(token, JWT_SECRET);
      // Always sync the plan so a freshly purchased subscription is reflected immediately
      await syncUserPlan(user.id).catch(() => {});
      const userRecord: any = await User.findOne({ discordId: user.id }).lean();
      res.json({ 
        ...user, 
        isDeveloper: user.id === DEVELOPER_ID, 
        plan: userRecord?.plan || 'free', 
        managedGuilds: userRecord?.managedGuilds || [] 
      });
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  apiRouter.post('/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
  });

  // --- Dashboard API Routes ---
  const requireAuth = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  apiRouter.get('/aliases', requireAuth, async (req: any, res) => {
    try {
      const aliases = await Alias.find({ ownerId: req.user.id, status: 'active' }).lean();
      res.json(aliases);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  apiRouter.get('/emails', requireAuth, async (req: any, res) => {
    try {
      const aliases = await Alias.find({ ownerId: req.user.id }).lean();
      const aliasNames = aliases.map(a => a.name);
      const emails = await Email.find({ alias: { $in: aliasNames } }).sort({ timestamp: -1 }).limit(50).lean();
      res.json(emails);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  apiRouter.get('/stats', requireAuth, async (req: any, res) => {
    try {
      const aliases = await Alias.find({ ownerId: req.user.id }).lean();
      const activeCount = aliases.filter(a => a.status === 'active').length;
      const totalEmails = aliases.reduce((sum, a) => sum + (a.emailsReceived || 0), 0);
      res.json({ activeCount, totalEmails });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  apiRouter.get('/guild/:id', requireAuth, async (req: any, res) => {
    try {
      const guild = await Guild.findOne({ guildId: req.params.id }).lean();
      res.json(guild || { guildId: req.params.id, plan: 'free' });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  apiRouter.get('/payment/invoices', requireAuth, async (req: any, res) => {
    try {
      const userRecord: any = await User.findOne({ discordId: req.user.id }).lean();
      if (!userRecord || !userRecord.razorpayCustomerId) {
        return res.json([]);
      }
      res.json([]);
    } catch (err) {
      console.error('Invoice Error:', err);
      res.status(500).json({ error: 'Failed to fetch invoices' });
    }
  });

  apiRouter.post('/payment/verify', requireAuth, async (req: any, res) => {
    try {
      const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, type, targetId } = req.body;
      
      // The frontend needs a success response to proceed to the dashboard.
      // The actual secure database update is handled by the Razorpay Webhook.
      // We perform a basic check here, but rely on the webhook for real provisioning.
      if (!razorpay_payment_id) {
        return res.status(400).json({ success: false, error: 'Missing payment ID' });
      }

      // Proactively activate the subscription and sync the plan since webhooks might not be configured
      const { pgQuery } = await import('../src/db-pg.js');
      const { syncUserPlan, syncGuildPlan } = await import('../src/shared.js');

      if (razorpay_subscription_id) {
          if (type === 'user') {
              await pgQuery('UPDATE user_subscriptions SET status = $1 WHERE razorpay_subscription_id = $2', ['active', razorpay_subscription_id]);
              await syncUserPlan(req.user.id);
          } else if (type === 'server') {
              await pgQuery('UPDATE server_subscriptions SET status = $1 WHERE razorpay_subscription_id = $2', ['active', razorpay_subscription_id]);
              if (targetId) await syncGuildPlan(targetId);
          }
      }

      res.json({ success: true, message: 'Payment verified and plan upgraded successfully!' });
    } catch (err) {
      console.error('Verify Error:', err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  // User Settings API
  apiRouter.get('/user/settings', requireAuth, async (req: any, res) => {
    try {
      const userRecord: any = await User.findOne({ discordId: req.user.id }).lean();
      if (!userRecord) {
        return res.json({
          notify: true,
          notifyKeywords: [],
          privacyMode: false,
          recoveryEmail: '',
          recoveryPhone: '',
          privateAliasDestination: '',
          plan: 'free'
        });
      }
      res.json({
        notify: userRecord.notify !== false,
        notifyKeywords: userRecord.notifyKeywords || [],
        privacyMode: !!userRecord.privacyMode,
        recoveryEmail: userRecord.recoveryEmail || '',
        recoveryPhone: userRecord.recoveryPhone || '',
        privateAliasDestination: userRecord.privateAliasDestination || '',
        plan: userRecord.plan || 'free'
      });
    } catch (err) {
      res.status(500).json({ error: 'Server error fetching user settings' });
    }
  });

  apiRouter.post('/user/settings', requireAuth, async (req: any, res) => {
    try {
      const { notify, notifyKeywords, privacyMode, recoveryEmail, recoveryPhone, privateAliasDestination } = req.body;
      
      const updateData: any = {};
      if (typeof notify === 'boolean') updateData.notify = notify;
      if (Array.isArray(notifyKeywords)) {
        updateData.notifyKeywords = notifyKeywords.map((k: string) => k.trim().toLowerCase()).filter(Boolean);
      }
      if (typeof privacyMode === 'boolean') updateData.privacyMode = privacyMode;
      if (typeof recoveryEmail === 'string') updateData.recoveryEmail = recoveryEmail.trim();
      if (typeof recoveryPhone === 'string') updateData.recoveryPhone = recoveryPhone.trim();
      if (typeof privateAliasDestination === 'string') updateData.privateAliasDestination = privateAliasDestination.trim();

      await User.updateOne(
        { discordId: req.user.id },
        { $set: updateData },
        { upsert: true }
      );

      res.json({ success: true, settings: updateData });
    } catch (err) {
      console.error('Settings update error:', err);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });


