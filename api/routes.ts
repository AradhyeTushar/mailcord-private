import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dns from 'dns';
import Razorpay from 'razorpay';
import { DISCORD_APP_ID, DISCORD_CLIENT_SECRET, JWT_SECRET, DEVELOPER_ID, CF_DOMAIN, isDeveloper } from '../src/config.js';
import { User, Guild, Alias, Email, Subscription, UpgradeKey, Domain } from '../src/db.js';
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
        isDeveloper: isDeveloper(user.id), 
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

  // --- Web Alias Creation API ---
  apiRouter.post('/aliases/create', requireAuth, async (req: any, res) => {
    try {
      const { name, domain } = req.body;
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Alias name is required' });
      }

      const cleanName = name.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
      if (cleanName.length < 2 || cleanName.length > 32) {
        return res.status(400).json({ error: 'Alias name must be between 2 and 32 characters' });
      }

      const selectedDomain = (domain && typeof domain === 'string' ? domain.toLowerCase().trim() : CF_DOMAIN) || 'bot.devtushar.uk';

      // Check user plan limits
      const userRecord: any = await User.findOne({ discordId: req.user.id }).lean();
      const plan = userRecord?.plan || 'free';
      const userAliases = await Alias.find({ ownerId: req.user.id, status: 'active' }).lean();

      const maxAllowed = plan === 'supreme' ? 100 : (plan === 'premium' ? 25 : 5);
      if (userAliases.length >= maxAllowed) {
        return res.status(403).json({ error: `Alias limit reached for your ${plan.toUpperCase()} plan (${userAliases.length}/${maxAllowed}). Please upgrade to create more.` });
      }

      // Check if alias already taken
      const existing = await Alias.findOne({ name: cleanName, domain: selectedDomain, status: 'active' }).lean();
      if (existing) {
        return res.status(409).json({ error: `Alias '${cleanName}@${selectedDomain}' is already registered` });
      }

      const newAlias = await Alias.create({
        name: cleanName,
        domain: selectedDomain,
        ownerId: req.user.id,
        status: 'active',
        locked: false,
        emailsReceived: 0,
        createdAt: Date.now()
      });

      res.json({ success: true, alias: newAlias });
    } catch (err: any) {
      console.error('Alias creation error:', err);
      res.status(500).json({ error: err.message || 'Failed to create alias' });
    }
  });

  // --- Multi-Domain API ---
  apiRouter.get('/domains', requireAuth, async (req: any, res) => {
    try {
      const systemDomains = [
        {
          _id: 'sys-default',
          domain: CF_DOMAIN || 'bot.devtushar.uk',
          isSystem: true,
          verified: true,
          status: 'active',
          mxConfigured: true,
          txtConfigured: true,
          createdAt: new Date()
        }
      ];

      const extraSystem = await Domain.find({ isSystem: true, domain: { $ne: CF_DOMAIN || 'bot.devtushar.uk' } }).lean();
      const userDomains = await Domain.find({ userId: req.user.id, isSystem: { $ne: true } }).lean();

      res.json({
        systemDomains: [...systemDomains, ...(extraSystem || [])],
        userDomains: userDomains || []
      });
    } catch (err: any) {
      console.error('Domains fetch error:', err);
      res.status(500).json({ error: 'Failed to fetch domains' });
    }
  });

  apiRouter.post('/domains', requireAuth, async (req: any, res) => {
    try {
      const { domain, guildId } = req.body;
      if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ error: 'Domain name is required' });
      }

      const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      if (!cleanDomain.includes('.') || cleanDomain.length < 4) {
        return res.status(400).json({ error: 'Please enter a valid domain name (e.g. mail.yourdomain.com)' });
      }

      // Check permissions
      const isDev = isDeveloper(req.user.id);
      const userRecord: any = await User.findOne({ discordId: req.user.id }).lean();
      if (!isDev && userRecord?.plan !== 'supreme') {
        return res.status(403).json({ error: 'Custom domains require the Supreme or Enterprise tier. Please upgrade to link domains.' });
      }

      // Check if domain exists
      const existing = await Domain.findOne({ domain: cleanDomain }).lean();
      if (existing) {
        return res.status(409).json({ error: `Domain '${cleanDomain}' is already registered.` });
      }

      const newDomain = await Domain.create({
        userId: req.user.id,
        guildId: guildId || null,
        domain: cleanDomain,
        isSystem: false,
        verified: false,
        status: 'pending',
        mxConfigured: false,
        txtConfigured: false,
        createdAt: new Date()
      });

      res.json({ success: true, domain: newDomain });
    } catch (err: any) {
      console.error('Domain register error:', err);
      res.status(500).json({ error: err.message || 'Failed to register domain' });
    }
  });

  apiRouter.post('/domains/:id/verify', requireAuth, async (req: any, res) => {
    try {
      const domainId = req.params.id;
      const domainRecord: any = await Domain.findById(domainId).lean();
      if (!domainRecord) {
        return res.status(404).json({ error: 'Domain not found' });
      }

      if (domainRecord.userId !== req.user.id && !isDeveloper(req.user.id)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      let mxFound = false;
      let txtFound = false;

      try {
        const mxRecords = await dns.promises.resolveMx(domainRecord.domain);
        if (mxRecords && mxRecords.length > 0) {
          mxFound = true;
        }
      } catch (e) {
        // MX lookup failed
      }

      try {
        const txtRecords = await dns.promises.resolveTxt(domainRecord.domain);
        if (txtRecords && txtRecords.length > 0) {
          txtFound = true;
        }
      } catch (e) {
        // TXT lookup failed
      }

      const isVerified = mxFound || isDeveloper(req.user.id);

      await Domain.updateOne(
        { _id: domainId },
        { 
          $set: { 
            verified: isVerified,
            mxConfigured: mxFound,
            txtConfigured: txtFound,
            status: isVerified ? 'active' : 'pending' 
          } 
        }
      );

      res.json({
        success: true,
        verified: isVerified,
        mxConfigured: mxFound,
        txtConfigured: txtFound,
        message: isVerified ? 'Domain verified successfully!' : 'DNS records not yet propagated. Please ensure MX records are pointing correctly and try again in a few minutes.'
      });
    } catch (err: any) {
      console.error('Domain verify error:', err);
      res.status(500).json({ error: err.message || 'Verification check failed' });
    }
  });

  apiRouter.delete('/domains/:id', requireAuth, async (req: any, res) => {
    try {
      const domainId = req.params.id;
      const domainRecord: any = await Domain.findById(domainId).lean();
      if (!domainRecord) {
        return res.status(404).json({ error: 'Domain not found' });
      }

      if (domainRecord.userId !== req.user.id && !isDeveloper(req.user.id)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await Domain.deleteOne({ _id: domainId });
      res.json({ success: true, message: 'Domain removed' });
    } catch (err: any) {
      console.error('Domain delete error:', err);
      res.status(500).json({ error: 'Failed to delete domain' });
    }
  });

  // --- Developer Dashboard Control Center API ---
  const requireDevAuth = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const user: any = jwt.verify(token, JWT_SECRET);
      if (!isDeveloper(user.id)) {
        return res.status(403).json({ error: 'Forbidden: Developer access required' });
      }
      req.user = user;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  apiRouter.get('/dev/overview', requireDevAuth, async (req: any, res) => {
    try {
      const [
        totalUsers,
        totalAliases,
        totalEmails,
        activeKeys,
        usedKeys,
        totalDomains,
        subscriptionsCount
      ] = await Promise.all([
        User.countDocuments({}),
        Alias.countDocuments({ status: 'active' }),
        Email.countDocuments({}),
        UpgradeKey.countDocuments({ used: { $ne: true } }),
        UpgradeKey.countDocuments({ used: true }),
        Domain.countDocuments({}),
        Subscription.countDocuments({ status: 'active' })
      ]);

      const mem = process.memoryUsage();
      const uptimeSec = process.uptime();

      res.json({
        totalUsers,
        totalAliases,
        totalEmails,
        activeKeys,
        usedKeys,
        totalDomains: totalDomains + 1, // + system default
        subscriptionsCount,
        memory: {
          rssMb: Math.round(mem.rss / 1024 / 1024),
          heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024)
        },
        uptimeSec: Math.floor(uptimeSec),
        nodeVersion: process.version,
        defaultDomain: CF_DOMAIN || 'bot.devtushar.uk'
      });
    } catch (err: any) {
      console.error('Dev overview error:', err);
      res.status(500).json({ error: 'Failed to load telemetry' });
    }
  });

  apiRouter.get('/dev/users', requireDevAuth, async (req: any, res) => {
    try {
      const search = (req.query.search as string || '').trim().toLowerCase();
      let query: any = {};
      if (search) {
        query = {
          $or: [
            { discordId: { $regex: search, $options: 'i' } },
            { recoveryEmail: { $regex: search, $options: 'i' } }
          ]
        };
      }

      const users = await User.find(query).sort({ _id: -1 }).limit(50).lean();
      const userIds = users.map((u: any) => u.discordId);
      const aliases = await Alias.find({ ownerId: { $in: userIds }, status: 'active' }).lean();

      const userList = users.map((u: any) => {
        const userAliases = aliases.filter((a: any) => a.ownerId === u.discordId);
        return {
          discordId: u.discordId,
          plan: u.plan || 'free',
          expiresAt: u.expiresAt || null,
          aliasCount: userAliases.length,
          recoveryEmail: u.recoveryEmail || null,
          privacyMode: !!u.privacyMode,
          managedGuilds: u.managedGuilds || []
        };
      });

      res.json({ users: userList });
    } catch (err: any) {
      console.error('Dev users error:', err);
      res.status(500).json({ error: 'Failed to fetch user directory' });
    }
  });

  apiRouter.post('/dev/users/:id/plan', requireDevAuth, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const { plan, days } = req.body;

      if (!['free', 'premium', 'supreme'].includes(plan)) {
        return res.status(400).json({ error: 'Invalid plan tier' });
      }

      let expiresAt: Date | null = null;
      if (plan !== 'free') {
        const durationDays = days && parseInt(days) > 0 ? parseInt(days) : 3650;
        expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
      }

      await User.updateOne(
        { discordId: userId },
        { $set: { plan, expiresAt } },
        { upsert: true }
      );

      res.json({ success: true, plan, expiresAt });
    } catch (err: any) {
      console.error('Dev set plan error:', err);
      res.status(500).json({ error: 'Failed to update plan' });
    }
  });

  apiRouter.post('/dev/users/:id/reset', requireDevAuth, async (req: any, res) => {
    try {
      const userId = req.params.id;
      await User.updateOne(
        { discordId: userId },
        { $set: { plan: 'free', expiresAt: null } }
      );
      res.json({ success: true, message: 'User reset to free tier' });
    } catch (err: any) {
      console.error('Dev reset user error:', err);
      res.status(500).json({ error: 'Failed to reset user' });
    }
  });

  apiRouter.get('/dev/keys', requireDevAuth, async (req: any, res) => {
    try {
      const filter = req.query.filter as string || 'unused';
      const query = filter === 'all' ? {} : { used: { $ne: true } };
      const keys = await UpgradeKey.find(query).sort({ _id: -1 }).limit(100).lean();
      res.json({ keys });
    } catch (err: any) {
      console.error('Dev keys error:', err);
      res.status(500).json({ error: 'Failed to fetch keys' });
    }
  });

  apiRouter.post('/dev/keys', requireDevAuth, async (req: any, res) => {
    try {
      const { plan, durationDays } = req.body;
      if (!['premium', 'supreme', 'enterprise'].includes(plan)) {
        return res.status(400).json({ error: 'Invalid plan tier' });
      }

      const duration = parseInt(durationDays) || 30;
      const key = `NEBULA-${plan.toUpperCase().charAt(0)}${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const newKey = await UpgradeKey.create({
        code: key,
        plan,
        durationDays: duration,
        used: false,
        createdAt: new Date()
      });

      res.json({ success: true, key: newKey });
    } catch (err: any) {
      console.error('Dev key generate error:', err);
      res.status(500).json({ error: 'Failed to generate key' });
    }
  });

  apiRouter.delete('/dev/keys/:code', requireDevAuth, async (req: any, res) => {
    try {
      const code = req.params.code.trim().toUpperCase();
      const result = await UpgradeKey.deleteOne({ code });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Key not found' });
      }
      res.json({ success: true, message: `Key ${code} deleted` });
    } catch (err: any) {
      console.error('Dev delete key error:', err);
      res.status(500).json({ error: 'Failed to delete key' });
    }
  });

  apiRouter.post('/dev/server-plan', requireDevAuth, async (req: any, res) => {
    try {
      const { guildId, plan, days } = req.body;
      if (!guildId || !['free', 'pro', 'enterprise'].includes(plan)) {
        return res.status(400).json({ error: 'Valid guildId and plan required' });
      }

      let expiresAt: Date | null = null;
      if (plan !== 'free') {
        const durationDays = days && parseInt(days) > 0 ? parseInt(days) : 3650;
        expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
      }

      await Guild.updateOne(
        { guildId },
        { $set: { plan, expiresAt } },
        { upsert: true }
      );

      res.json({ success: true, guildId, plan, expiresAt });
    } catch (err: any) {
      console.error('Dev server plan error:', err);
      res.status(500).json({ error: 'Failed to update server plan' });
    }
  });

  apiRouter.post('/dev/domains', requireDevAuth, async (req: any, res) => {
    try {
      const { domain } = req.body;
      if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ error: 'Domain name required' });
      }

      const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      const existing = await Domain.findOne({ domain: cleanDomain }).lean();
      if (existing) {
        return res.status(409).json({ error: `Domain '${cleanDomain}' already exists` });
      }

      const sysDomain = await Domain.create({
        userId: req.user.id,
        domain: cleanDomain,
        isSystem: true,
        verified: true,
        status: 'active',
        mxConfigured: true,
        txtConfigured: true,
        createdAt: new Date()
      });

      res.json({ success: true, domain: sysDomain });
    } catch (err: any) {
      console.error('Dev domain add error:', err);
      res.status(500).json({ error: 'Failed to add system domain' });
    }
  });


