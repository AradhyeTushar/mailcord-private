const fs = require('fs');

const original = fs.readFileSync('api/email.ts', 'utf-8');

const prefix = `import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';
import { EmbedBuilder } from 'discord.js';
import fs from 'fs/promises';
import path from 'path';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

import { getAlias, getEffectiveLimits, emailReceiveRateLimit } from '../src/shared.js';
import { User, Guild, Alias, Email } from '../src/db.js';
import { client } from '../bot/discord.js';
import { REDIS_URI } from '../src/config.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
export const emailRouter = express.Router();

const redisConnection = new Redis(REDIS_URI, { maxRetriesPerRequest: null });
const emailQueue = new Queue('incoming-emails', { connection: redisConnection });

`;

const detectOTPandAnalyze = original.match(/\/\/ --- Email Intelligence System ---[\s\S]+?async function analyzeEmail[\s\S]+?return \{ spamScore.*?\}\n\}/)[0];

const webhookBody = `
// Cloudflare Webhook for incoming emails
emailRouter.post('/incoming-email', express.json({ limit: '50mb' }), async (req, res) => {
  const logMsg = \`[\${new Date().toISOString()}] Received webhook payload: \${JSON.stringify({ to: req.body.to, from: req.body.from })}\\n\`;
  await fs.appendFile(path.join(process.cwd(), 'webhook.log'), logMsg).catch(() => {});
  console.log(\`Received email webhook for \${req.body.to} from \${req.body.from}\`);
  
  if (!req.body.to || !req.body.from) {
     return res.status(400).json({ error: 'Missing to/from' });
  }

  // Enqueue job and return immediately
  await emailQueue.add('process-email', {
    to: req.body.to,
    from: req.body.from,
    raw: req.body.raw,
    headers: req.body.headers
  });

  res.json({ success: true, enqueued: true });
});
`;

let processingLogicMatch = original.match(/if \(record && record\.status === 'active'\) \{([\s\S]+?)\} else \{/);
if (!processingLogicMatch) throw new Error("Could not match processing logic");
let processingLogic = processingLogicMatch[1];

// Replace all 'return res.json' with just 'return'
processingLogic = processingLogic.replace(/return res\.json\(\{.*\}\);/g, 'return;');

const workerBody = `
// Worker to process emails in background
const emailWorker = new Worker('incoming-emails', async job => {
  const { to, from, raw, headers } = job.data;
  const aliasName = to.split('@')[0].toLowerCase();
  
  try {
    const record = await getAlias(aliasName);

    if (record && record.status === 'active') {${processingLogic}} else {
      console.warn(\`[Worker] Received email for unknown or inactive alias: \${aliasName}\`);
    }
  } catch (err) {
    console.error('[Worker] Error processing email:', err);
    throw err;
  }
}, { connection: redisConnection });

emailWorker.on('completed', job => {
  console.log(\`[Worker] Job \${job.id} has completed!\`);
});
emailWorker.on('failed', (job, err) => {
  console.log(\`[Worker] Job \${job?.id} has failed with \${err.message}\`);
});
`;

const newTs = prefix + detectOTPandAnalyze + '\n\n' + webhookBody + '\n' + workerBody;
fs.writeFileSync('api/email.ts', newTs);
console.log("Rewritten successfully!");
