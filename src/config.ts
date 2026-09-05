import dotenv from 'dotenv';
dotenv.config();

export const DISCORD_APP_ID = process.env.DISCORD_CLIENT_ID || '1489402992393453678';
export const DISCORD_BOT_TOKEN =
  process.env.DISCORD_BOT_TOKEN ||
  (process.env.DISCORD_BOT_TOKEN_P1 && process.env.DISCORD_BOT_TOKEN_P2 && process.env.DISCORD_BOT_TOKEN_P3
    ? `${process.env.DISCORD_BOT_TOKEN_P1}.${process.env.DISCORD_BOT_TOKEN_P2}.${process.env.DISCORD_BOT_TOKEN_P3}`
    : '');
export const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
export const JWT_SECRET = process.env.JWT_SECRET || 'c3f5a8b9d2e1467c8a0b9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8';

export const CF_API_TOKEN = process.env.CF_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN || '';
export const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'b7a2dbf55f12a13b06c1f7a51dc59059';
export const CF_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID || 'ece18603c8c28e1cbfa19222167df87f';
export const CF_DOMAIN = process.env.CLOUDFLARE_DOMAIN || 'bot.devtushar.uk';

export const REDIS_URI = process.env.REDIS_URI || 'redis://127.0.0.1:6379';

export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
export const PREFIX = '!';
export const DEVELOPER_ID = process.env.DEVELOPER_ID || process.env.OWNER_ID || '560057266942902273';
