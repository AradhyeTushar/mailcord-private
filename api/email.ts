import express from 'express';
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
import { splitEmailBody } from '../src/lib/emailUtils.js';

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;
export const emailRouter = express.Router();

const redisConnection = REDIS_URI ? new Redis(REDIS_URI, { 
  maxRetriesPerRequest: 0,
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy: () => null // Stop reconnect loop if it fails
}) : null;

let useQueue = !!redisConnection;
if (redisConnection) {
  redisConnection.on('error', (err) => {
    if (useQueue) {
      console.error('[Redis] Connection failed. Using fallback (No Queue).');
      useQueue = false;
    }
  });
  // Silencing subsequent errors completely to keep console clean
  redisConnection.on('error', () => {}); 
} else {
  console.log('[Redis] No REDIS_URI provided. Running without background queue.');
}



// --- Email Intelligence System ---
function detectOTP(text: string): string | null {
  const otpRegex = /(?:code|otp|verification|pin|password|verify|auth|login)[\s:-]*(\d{4,8})\b/i;
  const specificMatch = text.match(otpRegex);
  if (specificMatch) return specificMatch[1];
  
  const codes = text.match(/\b\d{4,8}\b/g) || [];
  for (const code of codes) {
    const num = parseInt(code);
    if (num > 1900 && num < 2100) continue; 
    return code;
  }
  return null;
}

async function analyzeEmail(subject: string, body: string) {
  if (!ai) {
    return { spamScore: 0, category: 'Other', summary: 'AI summary disabled (GEMINI_API_KEY not configured).' };
  }
  try {
    const prompt = `Analyze the following email and provide a JSON response with the following fields:
    - spamScore: A number from 0 to 100 indicating how likely this is spam (100 = definitely spam).
    - category: The category of the email. Must be one of: "OTP", "Marketing", "Social", "Transactional", "Personal", "Other".
    - summary: A brief 1-2 sentence summary of the email content.

    Email Subject: ${subject}
    Email Body: ${body.substring(0, 1000)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
  } catch (err) {
    console.error("Error analyzing email with Gemini:", err);
  }
  return { spamScore: 0, category: 'Other', summary: 'Could not generate summary.' };
}

async function processEmailPipeline(data: any) {
  const { to, from, raw, headers } = data;
  const [aliasName, domainPart] = to.toLowerCase().split('@');
  
  try {
    const record = await getAlias(aliasName, domainPart);

    if (record && record.status === 'active') {
        await Alias.updateOne({ _id: record._id }, { $inc: { emailsReceived: 1 } });
        const userRecord: any = await User.findOne({ discordId: record.ownerId }).lean();
        
        if (userRecord) {
          const guildId = userRecord.guilds ? Object.keys(userRecord.guilds)[0] : null;
          const guildRecord: any = guildId ? await Guild.findOne({ guildId }).lean() || { plan: 'free' } : { plan: 'free' };
          const limits = getEffectiveLimits(userRecord.plan, guildRecord.plan);
          const now = Date.now();

          // Rate limit check
          const hourlyLimit = limits.aliasRateLimit === Infinity ? Infinity : limits.aliasRateLimit * 10;
          if (hourlyLimit !== Infinity) {
            const userRates = emailReceiveRateLimit.get(record.ownerId) || [];
            const recentRates = userRates.filter(t => now - t < 3600000);
            if (recentRates.length >= hourlyLimit) return;
            recentRates.push(now);
            emailReceiveRateLimit.set(record.ownerId, recentRates);
          }

          // Inbox storage limit
          if (limits.inboxSize !== Infinity) {
            const userAliases = await Alias.find({ ownerId: record.ownerId }).lean();
            const aliasNames = userAliases.map((a: any) => a.name);
            const emailCount = await Email.countDocuments({ alias: { $in: aliasNames } });
            if (emailCount >= limits.inboxSize) {
              const oldest = await Email.findOne({ alias: { $in: aliasNames } }).sort({ timestamp: 1 });
              if (oldest) await Email.deleteOne({ _id: oldest._id });
            }
          }

          const parsedEmail = await simpleParser(raw);
          const subject = parsedEmail.subject || headers['subject'] || 'No Subject';
          const bodyText = parsedEmail.text || parsedEmail.html || 'No text content found.';
          const { mainText, quotedText } = splitEmailBody(bodyText);
          const textSnippet = mainText.length > 1500 ? mainText.substring(0, 1500) + '...' : mainText;
          const quotedNotice = quotedText ? `\n\n💬 *Quoted email thread history omitted*` : '';
          
          const analysis = await analyzeEmail(subject, mainText || bodyText);

          const expiresAt = limits.retentionDays === Infinity ? undefined : now + (limits.retentionDays * 24 * 60 * 60 * 1000);
          const newEmail = await Email.create({
            alias: aliasName,
            from,
            subject,
            body: bodyText,
            guildId,
            expiresAt,
            spamScore: analysis.spamScore,
            category: analysis.category,
            summary: analysis.summary
          });

          if ((global as any).io) {
            (global as any).io.emit('new_email', { ownerId: record.ownerId, alias: aliasName, email: newEmail });
          }

          const filters = record.filters || [];
          let isSpam = analysis.spamScore > 80;
          let isImportant = false;
          for (const f of filters) {
             const isNegative = f.startsWith('-');
             const actualKeyword = isNegative ? f.substring(1) : f;
             if (subject.toLowerCase().includes(actualKeyword) || bodyText.toLowerCase().includes(actualKeyword)) {
                if (isNegative) isSpam = true;
                else isImportant = true;
             }
          }
          if (isSpam) return;

          const otp = detectOTP(bodyText);
          const otpText = otp ? `\n\n🔐 **Detected OTP:** \`${otp}\`` : '';
          const aiSummaryText = analysis.summary ? `\n\n🤖 **AI Summary:** ${analysis.summary}` : '';
          const categoryText = analysis.category ? `\n🏷️ **Category:** ${analysis.category}` : '';

          const embed = new EmbedBuilder()
            .setColor(isImportant ? '#F1C40F' : '#3498DB')
            .setTitle(subject)
            .setAuthor({ name: from })
            .setDescription(`\`\`\`text\n${textSnippet}\n\`\`\`${quotedNotice}${otpText}${aiSummaryText}${categoryText}${isImportant ? `\n\n⭐ **Marked Important**` : ''}`)
            .setFooter({ text: `To: ${to} | Spam Score: ${analysis.spamScore}/100` })
            .setTimestamp();

          const notifyUser = userRecord.notify !== false;
          let pingText = notifyUser ? `<@${record.ownerId}>` : '';
          
          if (userRecord.notifyKeywords?.length > 0) {
             if (userRecord.notifyKeywords.some((k:string) => subject.toLowerCase().includes(k) || bodyText.toLowerCase().includes(k))) {
                pingText = `🔔 **Keyword Alert!** <@${record.ownerId}>`;
             }
          }

          if (record.privacyMode) {
             const dest = userRecord.privateAliasDestination;
             if (dest?.startsWith('http')) {
                await fetch(dest, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: `📧 **Private Email** for \`${aliasName}\``, embeds: [embed.toJSON()] }) }).catch(() => {});
             } else {
                const discordUser = await client.users.fetch(record.ownerId).catch(() => null);
                if (discordUser) await discordUser.send({ content: `📧 **Private Email** for \`${aliasName}\``, embeds: [embed] }).catch(() => {});
             }
          } else if (userRecord.guilds) {
            for (const gId of Object.keys(userRecord.guilds)) {
              const chId = userRecord.guilds[gId].inboxChannelId;
              if (chId) {
                const channel = await client.channels.fetch(chId).catch(() => null);
                if (channel?.isTextBased()) await channel.send({ content: `📧 **New Email** ${pingText}`, embeds: [embed] }).catch(() => {});
              }
            }
          }

          if (record.webhookUrl) {
            await fetch(record.webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alias: aliasName, from, subject, body: bodyText, spamScore: analysis.spamScore, category: analysis.category, summary: analysis.summary }) }).catch(() => {});
          }

          if (record.forwardTo) {
            const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST || 'smtp.gmail.com', port: parseInt(process.env.SMTP_PORT || '587'), secure: false, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
            await transporter.sendMail({ from: `"MailCord" <${process.env.SMTP_USER}>`, to: record.forwardTo, subject: `Fwd: ${subject}`, text: `Forwarded from ${aliasName}\n\nOriginal: ${from}\n\n---\n\n${bodyText}` }).catch(() => {});
          }
        }
    }
  } catch (err) {
    console.error('[Pipeline] Error:', err);
  }
}

// Cloudflare Webhook for incoming emails
emailRouter.post('/incoming-email', express.json({ limit: '50mb' }), async (req, res) => {
  const { to, from, raw, headers } = req.body;
  if (!to || !from) return res.status(400).json({ error: 'Missing to/from' });
  
  console.log(`Received email for ${to} from ${from}`);

  if (useQueue) {
    try {
      await emailQueue.add('process-email', { to, from, raw, headers });
      return res.json({ success: true, enqueued: true });
    } catch (e) {
      console.error('[Queue] Add failed, falling back to direct.');
      useQueue = false;
    }
  }

  // Direct process fallback if Redis is down
  processEmailPipeline(req.body);
  res.json({ success: true, direct: true });
});

let emailQueue: any = null;
let emailWorker: any = null;

if (useQueue && redisConnection) {
  try {
    emailQueue = new Queue('incoming-emails', { 
      connection: redisConnection,
      defaultJobOptions: { removeOnComplete: true, removeOnFail: true }
    });
    emailQueue.on('error', () => {});

    emailWorker = new Worker('incoming-emails', async job => {
      await processEmailPipeline(job.data);
    }, { connection: redisConnection } as any);
    emailWorker.on('error', () => {});

    emailWorker.on('completed', job => {
      console.log(`[Worker] Job ${job.id} has completed!`);
    });

    emailWorker.on('failed', (job, err) => {
      console.log(`[Worker] Job ${job?.id} failed: ${err.message}`);
    });
  } catch (err) {
    console.warn('[Queue] Failed to initialize BullMQ, running directly.');
    useQueue = false;
  }
}

// ... (Rest of the file logic remains same)
