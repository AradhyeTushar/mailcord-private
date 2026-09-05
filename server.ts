import 'dotenv/config';
import fs from 'fs';

// --- Debug Logging ---
const logStream = fs.createWriteStream('server.log', { flags: 'a' });
const originalStdout = console.log;
console.log = (...args) => {
  logStream.write(`[LOG] ${args.join(' ')}\n`);
  originalStdout(...args);
};
const originalStderr = console.error;
console.error = (...args) => {
  logStream.write(`[ERR] ${args.join(' ')}\n`);
  originalStderr(...args);
};
console.log('--- STARTUP AT ' + new Date().toISOString() + ' ---');

// --- Stability & Error Prevention ---
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
  // We keep the process alive in Dev, but log clearly
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  // Optional: Graceful shutdown or allow TSX watch to restart
});

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { connectDB, Alias, User, Guild, Subscription } from './src/db.js';
import { client, initializeBot } from './bot/discord.js';
import { DISCORD_BOT_TOKEN, SEVEN_DAYS_MS } from './src/config.js';
import { apiRouter } from './api/routes.js';
import { emailRouter } from './api/email.js';
import { billingRouter } from './api/billing/routes.js';
import { handleRazorpayWebhook } from './api/billing/webhook.js';
import { pgQuery } from './src/db-pg.js';
import { RazorpayService } from './services/razorpay.service.js';
import { invalidateAliasCache, syncUserPlan } from './src/shared.js';
import SmeeClient from 'smee-client';

import { initSQL } from './src/db-pg.js';

await connectDB();
await initSQL();

// --- Background Jobs ---
function startBackgroundJobs() {
  setInterval(async () => {
    const now = new Date();
    try {
      // 1. Alias Cleanup
      const expiredAliases: any[] = await Alias.find({ 
        status: 'deleted', 
        deletedAt: { $lt: now.getTime() - SEVEN_DAYS_MS } 
      }).lean();
      
      for (const alias of expiredAliases) {
        await Alias.deleteOne({ _id: alias._id });
        invalidateAliasCache(alias.name);
      }

      // 2. Subscription Expiration Engine
      const expiredUsers = await User.find({
          plan: { $ne: 'free' },
          expiresAt: { $lt: now }
      });

      for (const user of expiredUsers) {
          // Sync plan with Stripe/Razorpay active subscriptions
          await syncUserPlan(user.discordId);

          // If they are downgraded to free, lock extra aliases
          const refreshedUser: any = await User.findOne({ discordId: user.discordId });
          if (refreshedUser && refreshedUser.plan === 'free') {
              // Lock premium aliases (keep oldest 5 active)
              const userAliases = await Alias.find({ ownerId: user.discordId }).sort({ createdAt: 1 });
              if (userAliases.length > 5) {
                  for (let i = 5; i < userAliases.length; i++) {
                      userAliases[i].locked = true;
                      await userAliases[i].save();
                  }
              }

              // Try to notify the user via Discord
          try {
              const discordUser = await client.users.fetch(user.discordId);
              if (discordUser) {
                  await discordUser.send("❌ Your MailCord Premium subscription has expired. Your plan has been downgraded to Free, and some aliases have been locked. Please visit the dashboard to renew.");
              }
          } catch (e) {
              console.log(`Failed to DM user ${user.discordId} about expiration`);
          }
          console.log(`Downgraded expired user: ${user.discordId}`);
        }
      }
    } catch (err) {
      console.error('Error in background jobs:', err);
    }
  }, 60 * 60 * 1000); // Run every hour

  // 3. Razorpay Consistency Safety System (Every 6 hours)
  setInterval(async () => {
    console.log('[CRON] Starting Razorpay consistency check...');
    try {
        const activeSubs = await pgQuery("SELECT razorpay_subscription_id FROM user_subscriptions WHERE status IN ('active', 'past_due')");
        for (const sub of activeSubs.rows) {
            const rzpSub = await RazorpayService.getSubscription(sub.razorpay_subscription_id);
            // If Razorpay status differs significantly, we could trigger a manual webhook process or update DB
            console.log(`[CRON] Verified sub ${sub.razorpay_subscription_id}: ${rzpSub.status}`);
        }
    } catch (err) {
        console.error('[CRON ERROR] Razorpay consistency check failed:', err);
    }
  }, 6 * 60 * 60 * 1000);
}
startBackgroundJobs();

// Note: client.login() is now handled in bot/discord.ts for consistency

// --- Express Server ---
async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: { origin: '*' }
  });
  
  (global as any).io = io;

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
  });

  const PORT = process.env.PORT || 3006;

  app.set('trust proxy', 1); // Trust the reverse proxy to get correct protocol (https)
  app.use(cookieParser());
  app.use(express.json({
    verify: (req: any, res, buf) => {
      if (req.originalUrl.includes('/webhook')) {
        req.rawBody = buf;
      }
    }
  }));
  app.use(express.urlencoded({ extended: true }));
  
  // Smee for Emails
  try {
    const smeeEmail = new SmeeClient({
      source: 'https://smee.io/mailcord-devtushar',
      target: `http://localhost:${PORT}/api/incoming-email`,
      logger: console
    });
    smeeEmail.start();
  } catch (e) {
    console.warn('[Smee] Failed to start Email webhook listener');
  }

  // Smee for Razorpay Payments
  if (process.env.SMEE_URL || process.env.NODE_ENV !== 'production') {
    try {
      const smeeUrl = process.env.SMEE_URL || 'https://smee.io/OnRSfHlSxHnrjKe4';
      const smeePayment = new SmeeClient({
        source: smeeUrl,
        target: `http://localhost:${PORT}/api/webhooks/razorpay`,
        logger: { 
            info: (...args: any) => console.log('[Smee Info]', ...args),
            error: (...args: any) => console.error('[Smee Error]', ...args)
        }
      });
      smeePayment.start();
      console.log(`[Smee] Payment listener active: ${smeeUrl} -> /api/webhooks/razorpay`);
    } catch (e) {
      console.warn('[Smee] Failed to start Payment webhook listener');
    }
  }

  // Graceful Shutdown Support
  const shutdown = (signal: string) => {
    console.log(`Received ${signal}. Shutting down server...`);
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
    setTimeout(() => {
        console.error('Could not close connections in time, forceful shutdown');
        process.exit(1);
    }, 5000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // --- Discord Bot Initialization ---
  try {
    await initializeBot();
  } catch (err) {
    console.error('[Bot Error] Critical failure during bot initialization. Check token and intents.');
  }

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  // --- New Billing System ---
  app.use('/api/billing', billingRouter);
  app.post('/api/webhooks/razorpay', async (req: any, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'] as string;
        const rawBody = req.rawBody.toString();
        await handleRazorpayWebhook(rawBody, signature);
        res.status(200).send('OK');
    } catch (err: any) {
        console.error('[WEBHOOK ERROR]', err.message);
        res.status(400).send(err.message);
    }
  });

  app.use('/api', apiRouter);
  app.use('/api', emailRouter);

  // Vite
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  }).on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[FATAL] Port ${PORT} is already in use. Please stop other MailCord instances.`);
      process.exit(1);
    } else {
      console.error('[FATAL] Server failed to start:', err);
      process.exit(1);
    }
  });
}

startServer();
