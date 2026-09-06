import { Alias, User, Guild } from './db.js';
import { CF_ZONE_ID, CF_API_TOKEN } from './config.js';
import { pgQuery } from './db-pg.js';

export const PRESETS: any = {
  streaming: ["netflix", "prime", "hotstar"],
  social: ["instagram", "twitter", "discord"],
  shopping: ["amazon", "flipkart"],
  gaming: ["steam", "epic", "riot"]
};

export function applyAliasIntelligence(name: string, limits: any) {
  const service = name.toLowerCase();
  let intelligence = {
    expiryOverride: undefined as number | undefined,
    priority: false,
    autoSpam: false,
    locked: false
  };

  if (service.includes('netflix')) intelligence.expiryOverride = Date.now() + (30 * 24 * 60 * 60 * 1000);
  if (service.includes('discord')) { intelligence.expiryOverride = undefined; intelligence.locked = true; }
  if (service.includes('amazon')) intelligence.priority = true;
  if (service.includes('instagram')) intelligence.autoSpam = true;

  return intelligence;
}

export function getEffectiveLimits(userPlan: string = 'free', guildPlan: string = 'free') {
  // Master Matrix v3
  let maxAliases = 10;
  let aliasRateLimit = 5;
  let inboxSize = 200;
  let retentionDays = 1;
  let customNames = false;
  let apiAccess = false;
  let features = false;
  let aliasExpiryDays = 7;
  let maxDestinations = 0;

  // 1. User Plan Hierarchy
  if (userPlan === 'supreme') {
    maxAliases = Infinity; aliasRateLimit = Infinity; inboxSize = Infinity; retentionDays = 90;
    customNames = true; apiAccess = true; features = true; aliasExpiryDays = Infinity;
    maxDestinations = 8;
  } else if (userPlan === 'premium') {
    maxAliases = 100; aliasRateLimit = 30; inboxSize = 5000; retentionDays = 30;
    customNames = true; apiAccess = false; features = true; aliasExpiryDays = Infinity;
    maxDestinations = 5;
  }

  // 2. Server Intersection
  if (guildPlan === 'enterprise') {
    if (userPlan === 'free') { maxAliases = 50; maxDestinations = 3; aliasExpiryDays = Infinity; retentionDays = 7; features = true; }
    else if (userPlan === 'premium') { maxDestinations = 9; }
    else if (userPlan === 'supreme') { maxDestinations = 13; }
  } else if (guildPlan === 'pro') {
    if (userPlan === 'free') { maxAliases = 25; maxDestinations = 1; aliasExpiryDays = 30; retentionDays = 3; }
    else if (userPlan === 'premium') { maxDestinations = 7; }
    else if (userPlan === 'supreme') { maxDestinations = 10; }
  }

  return { maxAliases, aliasRateLimit, inboxSize, retentionDays, customNames, apiAccess, features, aliasExpiryDays, maxDestinations };
}

export const aliasCache = new Map<string, any>();
export const creationRateLimit = new Map<string, number[]>();
export const emailReceiveRateLimit = new Map<string, number[]>();

export function checkCreationRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = creationRateLimit.get(userId) || [];
  const recent = timestamps.filter(t => now - t < 60000);
  if (recent.length >= 5) return false;
  recent.push(now);
  creationRateLimit.set(userId, recent);
  return true;
}

export async function getAlias(name: string, domain?: string) {
  const cacheKey = domain ? `${name}@${domain}` : name;
  if (aliasCache.has(cacheKey)) return aliasCache.get(cacheKey);
  
  let record: any = null;
  if (domain) {
    record = await Alias.findOne({ name, domain }).lean();
  }
  if (!record) {
    record = await Alias.findOne({ name }).lean();
  }
  if (record) aliasCache.set(cacheKey, record);
  return record;
}

export function invalidateAliasCache(name: string, domain?: string) {
  aliasCache.delete(name);
  if (domain) aliasCache.delete(`${name}@${domain}`);
}

export async function createCloudflareAlias(fullEmail: string) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/email/routing/rules`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      matchers: [{ type: 'literal', field: 'to', value: fullEmail }],
      actions: [{ type: 'worker', value: ['mailcord-worker'] }],
      enabled: true,
      name: `Discord Alias: ${fullEmail}`,
      priority: 0
    })
  });
  return await res.json();
}

export async function deleteCloudflareAlias(fullEmail: string) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/email/routing/rules`, {
    headers: { 'Authorization': `Bearer ${CF_API_TOKEN}` }
  });
  const data = await res.json();
  const rule = data.result?.find((r: any) => r.matchers[0]?.value === fullEmail);
  if (rule) {
    await fetch(`https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/email/routing/rules/${rule.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${CF_API_TOKEN}` }
    });
  }
}

export async function syncUserPlan(userId: string) {
  try {
    const res = await pgQuery(
      'SELECT * FROM user_subscriptions WHERE user_id = $1 AND status = \'active\' ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    const sub = res.rows[0];

    if (!sub) {
      console.log(`[SYNC] No active SQL subscription for ${userId}. Setting plan to free.`);
      await User.updateOne({ discordId: userId }, { $set: { plan: "free", expiresAt: null } });
      return;
    }

    // Map user_premium -> premium, user_supreme -> supreme
    const planMapping: any = {
      'user_premium': 'premium',
      'user_supreme': 'supreme'
    };
    const simplePlan = planMapping[sub.plan_id] || 'free';

    console.log(`[SYNC] Updating user ${userId} to ${simplePlan} until ${sub.current_period_end}`);
    await User.updateOne(
      { discordId: userId },
      {
        $set: {
          plan: simplePlan,
          expiresAt: sub.current_period_end,
          razorpaySubscriptionId: sub.razorpay_subscription_id
        }
      }
    );
    console.log(`[SYNC] Synced user ${userId} to plan ${simplePlan}`);
  } catch (err) {
    console.error(`[SYNC] Error syncing user ${userId}:`, err);
  }
}

export async function syncGuildPlan(guildId: string) {
    try {
      const res = await pgQuery(
        'SELECT * FROM server_subscriptions WHERE server_id = $1 AND status = \'active\' ORDER BY created_at DESC LIMIT 1',
        [guildId]
      );
      const sub = res.rows[0];
  
      if (!sub) {
        console.log(`[SYNC] No active SQL subscription for guild ${guildId}. Setting plan to free.`);
        await Guild.updateOne({ guildId }, { $set: { plan: "free", expiresAt: null } });
        return;
      }
  
      // Map guild_pro -> pro, guild_enterprise -> enterprise
      const planMapping: any = {
        'guild_pro': 'pro',
        'guild_enterprise': 'enterprise'
      };
      const simplePlan = planMapping[sub.plan_id] || 'free';
  
      console.log(`[SYNC] Updating guild ${guildId} to ${simplePlan} until ${sub.current_period_end}`);
      await Guild.updateOne(
        { guildId },
        {
          $set: {
            plan: simplePlan,
            expiresAt: sub.current_period_end,
            razorpaySubscriptionId: sub.razorpay_subscription_id
          }
        }
      );
      console.log(`[SYNC] Synced guild ${guildId} to plan ${simplePlan}`);
    } catch (err) {
      console.error(`[SYNC] Error syncing guild ${guildId}:`, err);
    }
  }

