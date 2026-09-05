import fs from 'fs';
import path from 'path';

fs.mkdirSync('bot', { recursive: true });
fs.mkdirSync('api', { recursive: true });


const serverTs = fs.readFileSync('server.ts', 'utf-8');
const lines = serverTs.split('\n');

function extractLines(startMarker, endMarker) {
  let startIndex = -1;
  let endIndex = lines.length;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(startMarker)) startIndex = i;
    if (endMarker && startIndex !== -1 && i > startIndex && lines[i].includes(endMarker)) {
      endIndex = i;
      break;
    }
  }

  if (startIndex === -1) return '';
  return lines.slice(startIndex, endIndex).join('\n');
}

// 1. Extract bot/discord.ts
const discordPart = extractLines('// --- Discord Bot Setup ---', '// --- Email Intelligence System ---');
const discordCode = `import { Client, GatewayIntentBits, REST, Routes, ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, Partials } from 'discord.js';
import { DISCORD_APP_ID, DISCORD_BOT_TOKEN, CF_DOMAIN } from '../src/config.js';
import { getEffectiveLimits, checkCreationRateLimit, getAlias, invalidateAliasCache, createCloudflareAlias, deleteCloudflareAlias } from '../src/shared.js';
import { User, Guild, Alias, Email } from '../src/db.js';
import nodemailer from 'nodemailer';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

` + discordPart + '\n\nexport { client };\n';

fs.writeFileSync('bot/discord.ts', discordCode);

// 2. Extract api/email.ts
const emailIntelligencePart = extractLines('// --- Email Intelligence System ---', '// --- Express Server ---');
const emailWebhookPart = extractLines('  // Cloudflare Webhook for incoming emails', '  // --- Razorpay API Routes ---');
const emailCode = `import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';
import { EmbedBuilder } from 'discord.js';
import fs from 'fs/promises';
import path from 'path';

import { getAlias, getEffectiveLimits, emailReceiveRateLimit } from '../src/shared.js';
import { User, Guild, Alias, Email } from '../src/db.js';
import { client } from '../bot/discord.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const emailRouter = express.Router();

` + emailIntelligencePart + '\n\n' + emailWebhookPart.replace("app.post('/api/incoming-email'", "emailRouter.post('/incoming-email'") + '\n';

fs.writeFileSync('api/email.ts', emailCode);

// 3. Extract api/routes.ts
const authRoutesPart = extractLines('  // --- Discord OAuth2 Routes ---', '  // --- Dashboard API Routes ---');
const dashboardRoutesPart = extractLines('  // --- Dashboard API Routes ---', '  // Cloudflare Webhook for incoming emails');
const razorpayRoutesPart = extractLines('  // --- Razorpay API Routes ---', '  // Vite');

const routesCode = `import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { DISCORD_APP_ID, DISCORD_CLIENT_SECRET, JWT_SECRET } from '../src/config.js';
import { User, Guild, Alias, Email } from '../src/db.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
});

export const apiRouter = express.Router();

` + authRoutesPart.replace(/app\./g, 'apiRouter.') + '\n' + dashboardRoutesPart.replace(/app\./g, 'apiRouter.') + '\n' + razorpayRoutesPart.replace(/app\./g, 'apiRouter.') + '\n';

fs.writeFileSync('api/routes.ts', routesCode);

console.log("Extraction complete.");
