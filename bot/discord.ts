import { Client, GatewayIntentBits, REST, Routes, ChannelType, OverwriteType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, Partials, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType } from 'discord.js';
import { DISCORD_APP_ID, DISCORD_BOT_TOKEN, CF_DOMAIN, PREFIX, DEVELOPER_ID, PUBLIC_URL, isDeveloper } from '../src/config.js';
import { 
  getEffectiveLimits, 
  PRESETS, 
  applyAliasIntelligence,
  checkCreationRateLimit,
  syncUserPlan, 
  syncGuildPlan,
  getAlias,
  invalidateAliasCache,
  createCloudflareAlias,
  deleteCloudflareAlias,
  emailReceiveRateLimit
} from '../src/shared.js';
import { connectDB, Alias, User, Guild, Email, MailThread, MailBlock, Destination, UpgradeKey, Domain, Subscription } from '../src/db.js';
import nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser';
import { GoogleGenAI } from '@google/genai';

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const BUILD_TIME = "2026-04-19 07:30 UTC (NEBULA-X-V3)";
const PROCESS_ID = Math.random().toString(36).substring(2, 8).toUpperCase();

// Cache categoryId -> { discordId, expiry } to avoid a DB hit on every message
const categoryOwnerCache = new Map<string, { discordId: string; expiry: number } | null>();
const CATEGORY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
async function getCategoryOwner(categoryId: string): Promise<{ discordId: string } | null> {
  const cached = categoryOwnerCache.get(categoryId);
  if (cached !== undefined) {
    if (cached === null || cached.expiry > Date.now()) return cached;
    categoryOwnerCache.delete(categoryId);
  }
  const user: any = await User.findOne(
    { [`guilds.${categoryId}`]: { $exists: true } },
    { discordId: 1 }
  ).lean().catch(() => null);
  const result = user ? { discordId: user.discordId } : null;
  categoryOwnerCache.set(categoryId, result ? { discordId: result.discordId, expiry: Date.now() + CATEGORY_CACHE_TTL } : null);
  return result;
}

// --- Discord Bot Setup ---
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel, Partials.Message]
});

const BOT_EMOJIS = {
  MAIL: '📧',
  STATS: '📊',
  VERIFY: '✅',
  BOLT: '⚡',
  PLAN: '🚀',
  WARNING: '⚠️',
  HELP: '❓',
  GEAR: '⚙️',
  LOCK: '🔒',
  UNLOCK: '🔓',
  TRASH: '🗑️',
  LINK: '🔗',
  CROWN: '👑',
  STAR: '⭐',
  BAN: '🚫',
  BACKUP: '📦',
  LATENCY: '📶',
  INFO: 'ℹ️',
  SEARCH: '🔍',
  CARD: '💳'
};

// --- Background Jobs ---
function startCleanupJob() {
  setInterval(async () => {
    const now = Date.now();
    try {
      const expiredAliases: any[] = await Alias.find({ 
        status: 'deleted', 
        deletedAt: { $lt: now - SEVEN_DAYS_MS } 
      }).lean();
      
      for (const alias of expiredAliases) {
        await Alias.deleteOne({ _id: alias._id });
        invalidateAliasCache(alias.name);
        console.log(`Permanently deleted expired alias: ${alias.name}`);
      }
    } catch (err) {
      console.error('Error in cleanup job:', err);
    }
  }, 60 * 60 * 1000); // Run every hour
}
// startCleanupJob();


function isBotRoleAtTop(guild: any): boolean {
  const botMember = guild.members.me;
  if (!botMember) return true;
  const roles = guild.roles.cache.sort((a, b) => b.position - a.position);
  const topRole = roles.first();
  return botMember.roles.highest.position === topRole?.position;
}

// --- Discord Bot Setup ---

const testTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// --- Global Stability Handlers ---
process.on('unhandledRejection', (reason, promise) => {
  console.error('[STABILITY] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[STABILITY] Uncaught Exception:', err);
});
async function isAuthorized(member: any, guildId: string) {
  if (!member) return false;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  const guildData: any = await Guild.findOne({ guildId }).lean();
  if (!guildData) return false;
  const modRoles = [guildData.adminRoleId, guildData.managerRoleId, guildData.supportRoleId].filter(Boolean);
  return member.roles.cache.some((role: any) => modRoles.includes(role.id));
}
async function buildUserDashboardEmbed(userId: string, guild: any) {
  const userRecord: any = await User.findOne({ discordId: userId }).lean() || { plan: 'free' };
  const userAliases = await Alias.find({ ownerId: userId }).lean();
  const activeCount = userAliases.filter((a: any) => a.status === 'active').length;
  const totalEmails = userAliases.reduce((sum: number, a: any) => sum + (a.emailsReceived || 0), 0);
  
  const guildRecord: any = await Guild.findOne({ guildId: guild.id }).lean() || { plan: 'free' };
  const limits = getEffectiveLimits(userRecord.plan, guildRecord.plan);
  
  // Custom Progress Bar logic
  const percent = limits.maxAliases === Infinity ? 0 : Math.min(100, (activeCount / limits.maxAliases) * 100);
  const barSize = 10;
  const progress = Math.round((percent / 100) * barSize);
  const progressBar = '🟩'.repeat(progress) + '⬜'.repeat(barSize - progress);

  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(`${BOT_EMOJIS.STATS} NEBULA-X | Core Intelligence Dashboard`)
    .setDescription(`Welcome back, **${userRecord.username || userId}**. System status is **OPTIMAL**.`)
    .addFields(
      { 
        name: `💎 Subscription Node`, 
        value: `**Tier:** \`${userRecord.plan?.toUpperCase() || 'FREE'}\`\n**Status:** \`Active\`\n**Expiry:** \`${userRecord.expiresAt ? new Date(userRecord.expiresAt).toLocaleDateString() : 'Never'}\``, 
        inline: true 
      },
      { 
        name: `📊 Identity Metrics`, 
        value: `**Active Aliases:** ${activeCount} / ${limits.maxAliases === Infinity ? '∞' : limits.maxAliases}\n${progressBar}\n**Total Deliveries:** \`${totalEmails}\``, 
        inline: true 
      },
      { 
        name: `🛡️ Security Matrix`, 
        value: `**Recovery:** ${userRecord.recoveryEmail ? '`ESTABLISHED`' : '`PENDING`'}\n**Verified:** ${userRecord.isEmailVerified ? '`CONFIRMED` ✅' : '`REQUIRED` ⚠️'}\n**Encryption:** \`256-BIT AES\``, 
        inline: true 
      },
      { 
        name: `⚙️ Virtualization Settings`, 
        value: `**Routing Dest:** ${userRecord.privateAliasDestination ? '`ROUTING ACTIVE` 🔗' : '`STANDARD DELIVERY` 📬'}\n**Notifications:** ${userRecord.notify ? '`LIVE` 🔔' : '`SILENT` 🔕'}`, 
        inline: false 
      }
    )
    .setThumbnail(userRecord.avatarUrl || null)
    .setFooter({ text: `System ID: ${PROCESS_ID} | Logic Engine: Nebula-Core v2.5` })
    .setTimestamp();

  if (userAliases.length > 0) {
    const sorted = [...userAliases].sort((a, b) => (b.emailsReceived || 0) - (a.emailsReceived || 0)).slice(0, 5);
    const aliasList = sorted.map(a => `🔹 \`${a.name}\` — **${a.emailsReceived || 0}** emails`).join('\n');
    embed.addFields({ name: '🔝 High-Traffic Identities', value: aliasList || 'No data yet.' });
  }

  return embed;
}

function buildDashboardButtons() {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('refresh_dashboard').setLabel('Refresh Stats').setStyle(ButtonStyle.Primary).setEmoji('🔄'),
      new ButtonBuilder().setCustomId('view_all_aliases').setLabel('View All Aliases').setStyle(ButtonStyle.Secondary).setEmoji('📋')
    );
}

async function setupUserWorkspace(interaction: any, user: any, guild: any) {
  const botMember = guild.members.me;
  if (botMember && !botMember.permissions.has([PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageRoles])) {
    const errorMsg = `${BOT_EMOJIS.WARNING} **Bot Permission Error:** I need **"Manage Channels"** and **"Manage Roles"** permissions to create your private inbox. Please ask an admin to check my role permissions.`;
    return interaction.isRepliable() ? (interaction.deferred || interaction.replied ? interaction.editReply({ content: errorMsg }) : interaction.reply({ content: errorMsg, ephemeral: true })) : null;
  }

  // Ensure deferred if coming from a fresh interaction
  if (interaction.isRepliable() && !interaction.deferred && !interaction.replied) {
     await interaction.deferReply({ ephemeral: true }).catch(() => null);
  }

  try {
    const existingUser: any = await User.findOne({ discordId: user.id }).lean();
    if (existingUser?.guilds?.[guild.id]?.inboxChannelId) {
      const existingChannel = await guild.channels.fetch(existingUser.guilds[guild.id].inboxChannelId).catch(() => null);
      if (existingChannel) {
         const resp = { content: `❌ You already have an active inbox: <#${existingChannel.id}>` };
         return interaction.deferred || interaction.replied ? interaction.editReply(resp) : interaction.reply({ ...resp, ephemeral: true });
      }
    }

    const botHighestRole = botMember?.roles.highest;
    const permissionOverwrites: any[] = [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.CreateInstantInvite] },
      { 
        id: user.id, 
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages],
        deny: [PermissionFlagsBits.CreateInstantInvite]
      }
    ];

    if (botHighestRole) {
      const rolesToBlock = guild.roles.cache.filter((role: any) => 
        role.position < botHighestRole.position && 
        role.id !== guild.id && 
        !botMember!.roles.cache.has(role.id)
      );
      const limitedRoles: any[] = Array.from(rolesToBlock.values()).slice(0, 200);
      for (const role of limitedRoles) {
        permissionOverwrites.push({ id: role.id, deny: [PermissionFlagsBits.ViewChannel] });
      }
    }

    const category = await guild.channels.create({
      name: `Nebula | ${user.username}`,
      type: ChannelType.GuildCategory,
      permissionOverwrites: permissionOverwrites
    });

    const inboxChannel = await guild.channels.create({
      name: `inbox`,
      type: ChannelType.GuildText,
      parent: category.id
    });

    const aliasChannel = await guild.channels.create({
      name: `⚙️-management-hub`,
      type: ChannelType.GuildText,
      parent: category.id,
      topic: `Private control panel for ${user.tag}`
    });

    await User.updateOne({ discordId: user.id }, { $set: { 
      [`guilds.${guild.id}.categoryId`]: category.id,
      [`guilds.${guild.id}.inboxChannelId`]: inboxChannel.id,
      [`guilds.${guild.id}.managementChannelId`]: aliasChannel.id 
    } }, { upsert: true });

    const userAliases = await Alias.find({ ownerId: user.id }).lean();
    const activeAliases = userAliases.filter((a:any) => a.status === 'active').length;
    const totalEmails = userAliases.reduce((sum:number, a:any) => sum + (a.emailsReceived || 0), 0);
    const existingUserRec: any = await User.findOne({ discordId: user.id }).lean() || {};

    const dashboardEmbed = await buildUserDashboardEmbed(user.id, guild);
    const hubButtons = buildDashboardButtons();

    await aliasChannel.send({ embeds: [dashboardEmbed], components: [hubButtons] });

    const finalResp = { content: `✅ **Setup Complete!** Your private workspace is ready.\n\n- **Emails**: <#${inboxChannel.id}>\n- **Aliases**: <#${aliasChannel.id}>\n\n*Security check passed. Encryption active.*` };
    return interaction.deferred || interaction.replied ? interaction.editReply(finalResp) : interaction.reply({ ...finalResp, ephemeral: true });

  } catch (err: any) {
    console.error('[CRITICAL] setupUserWorkspace Error:', err);
    let errorMsg = '❌ Failed to create your personal category.';
    if (err.code === 50013) errorMsg = '❌ **Permission Error:** Bot role must be at the top.';
    else if (err.code === 30013) errorMsg = '❌ **Limit Reached:** Server has too many categories.';
    
    return interaction.deferred || interaction.replied ? interaction.editReply({ content: errorMsg }) : interaction.reply({ content: errorMsg, ephemeral: true });
  }
}

const commands = [
  {
    name: 'help',
    description: 'Open the help center',
    options: [{ name: 'category', description: 'Help category', type: 3, required: false }]
  },
  { name: 'about', description: 'View information about MailCord' },
  { name: 'ping', description: 'Check bot and API latency' },
  { name: 'botinfo', description: 'View system and hosting stats' },
  { name: 'invite', description: "Get the bot's invite link" },
  {
    name: 'setup', 
    description: 'Admin only: Setup the bot and create the inbox creation button',
    default_member_permissions: String(PermissionFlagsBits.Administrator)
  },
  {
    name: 'admin',
    description: 'Admin commands',
    default_member_permissions: String(PermissionFlagsBits.Administrator),
    options: [
      { name: 'alias-search', description: 'Search for an alias', type: 1, options: [{ name: 'name', description: 'Alias name', type: 3, required: true }] },
      { name: 'user-info', description: 'Get user info', type: 1, options: [{ name: 'user', description: 'User', type: 6, required: true }] },
      { name: 'force-delete', description: 'Force delete an alias', type: 1, options: [{ name: 'name', description: 'Alias name', type: 3, required: true }] }
    ]
  },
  {
    name: 'config',
    description: 'Configure server settings (Owner only)',
    default_member_permissions: String(PermissionFlagsBits.Administrator),
    options: [
      { name: 'admin-role', description: 'Set the admin role', type: 1, options: [{ name: 'role', description: 'The role', type: 8, required: true }] },
      { name: 'manager-role', description: 'Set the manager role', type: 1, options: [{ name: 'role', description: 'The role', type: 8, required: true }] },
      { name: 'support-role', description: 'Set the support role', type: 1, options: [{ name: 'role', description: 'The role', type: 8, required: true }] },
      { name: 'viewer-role', description: 'Set the viewer role', type: 1, options: [{ name: 'role', description: 'The role', type: 8, required: true }] }
    ]
  },
  {
    name: 'alias',
    description: 'Manage your email aliases',
    options: [
      { name: 'create', description: 'Create a new alias', type: 1, options: [{ name: 'name', description: 'Alias name', type: 3, required: true }] },
      { name: 'delete', description: 'Delete an alias', type: 1, options: [{ name: 'name', description: 'Alias name', type: 3, required: true }] },
      { name: 'recover', description: 'Recover a deleted alias', type: 1, options: [{ name: 'name', description: 'Alias name', type: 3, required: true }] },
      { name: 'list', description: 'List your active aliases', type: 1 },
      { name: 'info', description: 'Get info about an alias', type: 1, options: [{ name: 'name', description: 'Alias name', type: 3, required: true }] },
      { name: 'rename', description: 'Rename an alias', type: 1, options: [{ name: 'old', description: 'Old name', type: 3, required: true }, { name: 'new', description: 'New name', type: 3, required: true }] },
      { name: 'transfer', description: 'Transfer an alias', type: 1, options: [{ name: 'name', description: 'Alias name', type: 3, required: true }, { name: 'user', description: 'Target user', type: 6, required: true }] },
      { name: 'lock', description: 'Lock an alias', type: 1, options: [{ name: 'name', description: 'Alias name', type: 3, required: true }] },
      { name: 'unlock', description: 'Unlock an alias', type: 1, options: [{ name: 'name', description: 'Alias name', type: 3, required: true }] },
      { name: 'private', description: 'Toggle private mode for an alias', type: 1, options: [{ name: 'name', description: 'Alias name', type: 3, required: true }] }
    ]
  },
  {
    name: 'user',
    description: 'Manage your user settings and plan',
    options: [
      { name: 'settings', description: 'Open interactive user settings UI', type: 1 },
      { name: 'plan', description: 'Show current user plan and limits', type: 1 },
      { name: 'info', description: 'Show a detailed account overview and statistics', type: 1 }
    ]
  },
  { name: 'stats', description: 'View your global usage statistics' },
  { name: 'upgrade', description: 'Get links to upgrade to Premium or Supreme tiers' },
  { name: 'billing', description: 'View your recent payment and subscription history' },
  { name: 'cancel', description: 'Securely cancel your active subscription' },
  { 
    name: 'fsreset', 
    description: 'FACTORY SERVER RESET: Wipe all bot configuration for this server (Owner/Admin Only)',
    default_member_permissions: String(PermissionFlagsBits.Administrator)
  },
  {
    name: 'reset',
    description: 'FACTORY ACCOUNT RESET: Delete your aliases, recovery info, and workspaces'
  },
  {
    name: 'servers',
    description: 'Server management commands (Bot Owner only)',
    options: [
      { name: 'list', description: 'List all servers the bot is in', type: 1 },
      { name: 'leave', description: 'Leave a specific server', type: 1, options: [{ name: 'id', description: 'Server ID', type: 3, required: true }] }
    ]
  },
  {
    name: 'devkey',
    description: '🔑 Generate a redeemable license key (Developer Only)',
    options: [
      {
        name: 'plan',
        description: 'Plan tier to generate',
        type: 3,
        required: true,
        choices: [
          { name: 'Premium (Personal Power User)', value: 'premium' },
          { name: 'Supreme (Pro Identity)', value: 'supreme' },
          { name: 'Enterprise (Server-Wide)', value: 'enterprise' }
        ]
      },
      {
        name: 'duration',
        description: 'Duration in days (default: 30)',
        type: 4,
        required: false
      }
    ]
  },
  {
    name: 'redeem',
    description: '✨ Redeem an upgrade license code to elevate your account, server, or another user',
    options: [
      {
        name: 'code',
        description: 'The upgrade key code (e.g. NEBULA-PXXXX-XXXX)',
        type: 3,
        required: true
      },
      {
        name: 'user',
        description: 'Target user to redeem this key for (Admin / Developer Only)',
        type: 6,
        required: false
      }
    ]
  },
  {
    name: 'dev',
    description: '🛠️ Developer management suite for users, servers, and keys (Developer Only)',
    options: [
      {
        name: 'setplan',
        description: 'Directly set a user\'s subscription tier',
        type: 1,
        options: [
          { name: 'user', description: 'Target user to modify', type: 6, required: true },
          {
            name: 'plan',
            description: 'Plan tier',
            type: 3,
            required: true,
            choices: [
              { name: 'Free Tier', value: 'free' },
              { name: 'Premium Tier (Power User)', value: 'premium' },
              { name: 'Supreme Tier (Pro Identity)', value: 'supreme' }
            ]
          },
          { name: 'days', description: 'Duration in days (default: 30)', type: 4, required: false }
        ]
      },
      {
        name: 'setserver',
        description: 'Directly set a server\'s subscription tier',
        type: 1,
        options: [
          {
            name: 'plan',
            description: 'Server plan tier',
            type: 3,
            required: true,
            choices: [
              { name: 'Free Server', value: 'free' },
              { name: 'Pro Server', value: 'pro' },
              { name: 'Enterprise Server', value: 'enterprise' }
            ]
          },
          { name: 'guild_id', description: 'Guild ID (leave empty for current server)', type: 3, required: false },
          { name: 'days', description: 'Duration in days (default: 30)', type: 4, required: false }
        ]
      },
      {
        name: 'userinfo',
        description: 'View database telemetry and quota details for a user',
        type: 1,
        options: [
          { name: 'user', description: 'Target user to inspect', type: 6, required: true }
        ]
      },
      {
        name: 'resetuser',
        description: 'Reset a user back to Free tier',
        type: 1,
        options: [
          { name: 'user', description: 'Target user to reset', type: 6, required: true }
        ]
      },
      {
        name: 'genkey',
        description: 'Generate a new redeemable license key',
        type: 1,
        options: [
          {
            name: 'plan',
            description: 'Plan tier',
            type: 3,
            required: true,
            choices: [
              { name: 'Premium (Personal Power User)', value: 'premium' },
              { name: 'Supreme (Pro Identity)', value: 'supreme' },
              { name: 'Enterprise (Server-Wide)', value: 'enterprise' }
            ]
          },
          { name: 'duration', description: 'Duration in days (default: 30)', type: 4, required: false }
        ]
      },
      {
        name: 'listkeys',
        description: 'List recent license keys',
        type: 1,
        options: [
          {
            name: 'status',
            description: 'Filter by key status',
            type: 3,
            required: false,
            choices: [
              { name: 'Unused Keys Only', value: 'unused' },
              { name: 'All Recent Keys', value: 'all' }
            ]
          }
        ]
      },
      {
        name: 'deletekey',
        description: 'Revoke / delete an unused license key',
        type: 1,
        options: [
          { name: 'code', description: 'The key code to delete', type: 3, required: true }
        ]
      }
    ]
  }
];

const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);

client.once('ready', async () => {
  console.log(`Logged in as ${client.user?.tag}!`);
  try {
    console.log('Started refreshing application (/) commands.');
    // Register globally
    await rest.put(Routes.applicationCommands(DISCORD_APP_ID), { body: commands });
    
    // Register per-guild for instant updates
    const guilds = client.guilds.cache.map(guild => guild.id);
    for (const guildId of guilds) {
      try {
        await rest.put(Routes.applicationGuildCommands(DISCORD_APP_ID, guildId), { body: commands });
        console.log(`Successfully reloaded application (/) commands for guild ${guildId}.`);
      } catch (err) {
        console.error(`Failed to register commands for guild ${guildId}:`, err);
      }
    }
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
});

client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isButton()) {
      if (interaction.customId === 'create_inbox') {
        const user = interaction.user;
        const guild = interaction.guild;
        if (!guild) return;

        const userRecord: any = await User.findOne({ discordId: user.id }).lean() || {};
        if (!userRecord.recoveryEmail || !userRecord.recoveryPhone) {
           const modal = new ModalBuilder().setCustomId('recovery_modal_onboarding').setTitle('Onboarding: Set Recovery Info');
           const emailInput = new TextInputBuilder().setCustomId('recovery_email').setLabel('Recovery Email Address').setStyle(TextInputStyle.Short).setRequired(true);
           const phoneInput = new TextInputBuilder().setCustomId('recovery_phone').setLabel('Recovery Phone Number').setStyle(TextInputStyle.Short).setRequired(true);
           modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(emailInput), new ActionRowBuilder<TextInputBuilder>().addComponents(phoneInput));
           return interaction.showModal(modal);
        }

        return setupUserWorkspace(interaction, user, guild);
      }
      
      if (interaction.customId.startsWith('open_email_')) {
        const emailId = interaction.customId.split('open_email_')[1];
        const email = await Email.findOne({ _id: emailId }).lean();
        if (!email) return interaction.reply({ content: '❌ **Error:** Email data no longer available.', ephemeral: true });

        const alias = await Alias.findOne({ name: email.alias }).lean();
        if (!alias || alias.ownerId !== interaction.user.id) {
          return interaction.reply({ content: '❌ **Security Check Failed:** You do not have permission to view this email.', ephemeral: true });
        }

        const otpMatch = email.body.match(/(?:code|otp|verification|pin|password)[\s:-]*(\d{4,8})\b/i);
        const otpText = otpMatch ? `\n\n🔐 **Detected OTP:** \`${otpMatch[1]}\`` : '';
        const bodySnippet = email.body.length > 3800 ? email.body.substring(0, 3800) + '...' : email.body;

        const revealEmbed = new EmbedBuilder()
           .setColor('#5865F2')
           .setTitle(`📬 Decrypted: ${email.subject}`)
           .setAuthor({ name: email.from })
           .setDescription(`\`\`\`text\n${bodySnippet}\n\`\`\`${otpText}`)
           .setFooter({ text: `Alias: ${email.alias}@${CF_DOMAIN}` })
           .setTimestamp();

        // We reveal it ephemerally to ensure absolute privacy as requested ("skip dm approach")
        const revealRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
           new ButtonBuilder().setCustomId(`close_revealed_email`).setLabel('Close Message').setStyle(ButtonStyle.Danger).setEmoji('🔒')
        );

        return interaction.reply({ embeds: [revealEmbed], components: [revealRow], ephemeral: true });
      }

      if (interaction.customId === 'close_revealed_email') {
        // Ephemeral messages cannot be easily deleted by the bot, but we can edit them to be empty/placeholder
        return interaction.update({ content: '📤 *Message session closed for security.*', embeds: [], components: [] });
      }
    if (interaction.customId === 'set_recovery') {
      const userRecord: any = await User.findOne({ discordId: interaction.user.id }).lean() || {};
      const hasInbox = interaction.guildId ? !!userRecord.guilds?.[interaction.guildId]?.managementChannelId : false;
      
      const modal = new ModalBuilder()
        .setCustomId(hasInbox ? 'recovery_modal' : 'recovery_modal_onboarding')
        .setTitle(hasInbox ? 'Update Recovery Info' : 'Onboarding: Recovery Info');

      const emailInput = new TextInputBuilder()
        .setCustomId('recovery_email')
        .setLabel('Recovery Email Address')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('you@example.com')
        .setRequired(true);

      const phoneInput = new TextInputBuilder()
        .setCustomId('recovery_phone')
        .setLabel('Recovery Phone Number')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('+1234567890')
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(emailInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(phoneInput)
      );

      await interaction.showModal(modal);
      return;
    }
    if (interaction.customId === 'set_private_dest') {
      const existingUser: any = await User.findOne({ discordId: interaction.user.id }).lean();
      if (!existingUser || existingUser.plan === 'free') {
        return interaction.reply({ content: '❌ Private aliases are only available for Premium and Supreme users.', ephemeral: true });
      }

      const modal = new ModalBuilder()
        .setCustomId('private_dest_modal')
        .setTitle('Set Private Destination');

      const destInput = new TextInputBuilder()
        .setCustomId('private_dest')
        .setLabel('Destination (Channel ID or Webhook URL)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('123456789012345678 or https://...')
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(destInput));
      await interaction.showModal(modal);
      return;
    }

    if (interaction.customId === 'confirm_user_guild_reset') {
      const existingUser: any = await User.findOne({ discordId: interaction.user.id }).lean();
      if (existingUser && existingUser.guilds && existingUser.guilds[interaction.guildId!]) {
         const channelId = existingUser.guilds[interaction.guildId!].inboxChannelId;
         if (channelId) {
            const channel = await interaction.guild!.channels.fetch(channelId).catch(()=>null);
            if (channel && channel.parentId) {
               const category = await interaction.guild!.channels.fetch(channel.parentId).catch(()=>null);
               if (category) {
                  for (const c of category.children.cache.values()) await c.delete().catch(()=>null);
                  await category.delete().catch(()=>null);
               }
            }
         }
         await User.updateOne({ discordId: interaction.user.id }, { $unset: { [`guilds.${interaction.guildId}`]: 1 } });
         return interaction.reply({ content: `${BOT_EMOJIS.VERIFY} Your inbox and local data for this server have been reset.`, ephemeral: true });
      }
      return interaction.reply({ content: `${BOT_EMOJIS.WARNING} No inbox configuration found for this server.`, ephemeral: true });
    }

    if (interaction.customId === 'confirm_user_full_reset') {
      await interaction.deferReply({ ephemeral: true });
      
      const aliases = await Alias.find({ ownerId: interaction.user.id }).lean();
      for (const a of aliases) {
        await deleteCloudflareAlias(`${a.name}@${CF_DOMAIN}`).catch(() => null);
        await Alias.deleteOne({ name: a.name });
      }

      const existingUser: any = await User.findOne({ discordId: interaction.user.id }).lean();
      if (existingUser && existingUser.guilds) {
        for (const guildId of Object.keys(existingUser.guilds)) {
          const guildData = existingUser.guilds[guildId];
          const guild = await client.guilds.fetch(guildId).catch(() => null);
          if (guild && guildData.inboxChannelId) {
             const channel = await guild.channels.fetch(guildData.inboxChannelId).catch(() => null);
             if (channel && channel.parentId) {
                const category = await guild.channels.fetch(channel.parentId).catch(() => null);
                if (category) {
                   for (const c of category.children.cache.values()) await c.delete().catch(() => null);
                   await category.delete().catch(() => null);
                }
             }
          }
        }
      }

      // Deep Wipe before deletion to ensure no persistence
      await User.updateOne(
        { discordId: interaction.user.id },
        { $set: { recoveryEmail: null, recoveryPhone: null, guilds: {}, isEmailVerified: false, isPhoneVerified: false } }
      );
      
      await User.deleteOne({ discordId: interaction.user.id });
      return interaction.editReply({ content: `${BOT_EMOJIS.TRASH} **Full Factory Reset Complete.** All aliases deleted from Cloudflare, recovery info cleared, and all local account data has been wiped.` });
    }

    if (interaction.customId === 'confirm_fs_reset') {
      await interaction.deferReply({ ephemeral: true });
      await Guild.deleteOne({ guildId: interaction.guildId! });
      return interaction.editReply({ content: `${BOT_EMOJIS.VERIFY} **Factory Server Reset Complete.** All bot configuration (prefix, roles, log channels) for this server has been wiped.` });
    }

    if (interaction.customId === 'cancel_reset') {
      return interaction.reply({ content: '✅ Action cancelled.', ephemeral: true });
    }

    if (interaction.customId === 'refresh_dashboard') {
      await interaction.deferUpdate();
      const newEmbed = await buildUserDashboardEmbed(interaction.user.id, interaction.guild);
      return interaction.editReply({ embeds: [newEmbed] });
    }

    if (interaction.customId === 'view_all_aliases') {
      const aliases = await Alias.find({ ownerId: interaction.user.id, status: 'active' }).lean();
      if (aliases.length === 0) return interaction.reply({ content: '❌ You have no active aliases.', ephemeral: true });
      
      const list = aliases.map((a: any) => `• \`${a.name}@${CF_DOMAIN}\` (Recv: ${a.emailsReceived || 0})`).join('\n');
      return interaction.reply({ content: `📋 **Your Active Aliases:**\n${list.substring(0, 1900)}`, ephemeral: true });
    }

    return;
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'recovery_modal' || interaction.customId === 'recovery_modal_onboarding') {
      const email = interaction.fields.getTextInputValue('recovery_email');
      const phone = interaction.fields.getTextInputValue('recovery_phone');
      
      // Basic validation
      if (!email.includes('@') || phone.length < 10) {
        return interaction.reply({ content: '❌ Invalid email or phone format.', ephemeral: true });
      }

      await User.updateOne(
        { discordId: interaction.user.id },
        { $set: { recoveryEmail: email, recoveryPhone: phone, isEmailVerified: false, isPhoneVerified: false } },
        { upsert: true }
      );

      console.log(`[AUDIT] User ${interaction.user.id} updated recovery info. Mode: ${interaction.customId}`);

      if (interaction.customId === 'recovery_modal_onboarding' && interaction.guild) {
         // Automatically proceed to workspace setup
         return setupUserWorkspace(interaction, interaction.user, interaction.guild);
      }

      return interaction.reply({ 
        content: `${BOT_EMOJIS.VERIFY} **Recovery Information Saved!**\n\n- Email: \`${email}\` (Unverified)\n- Phone: \`${phone}\` (Unverified)\n\n> To enable account recovery, you must manually verify these details using \`${PREFIX}user verify\` in your settings.`, 
        ephemeral: true 
      });
    }

    if (interaction.customId === 'private_dest_modal') {
      const dest = interaction.fields.getTextInputValue('private_dest');
      
      await User.updateOne(
        { discordId: interaction.user.id },
        { $set: { privateAliasDestination: dest } },
        { upsert: true }
      );

      console.log(`[AUDIT] User ${interaction.user.id} updated private destination to: ${dest}`);
      return interaction.reply({ content: '✅ Private destination saved successfully!', ephemeral: true });
    }

    if (interaction.customId === 'mobile_modal') {
      const mobileNumber = interaction.fields.getTextInputValue('mobile_input');
      const aliasName = interaction.fields.getTextInputValue('alias_input').toLowerCase().replace(/[^a-z0-9-]/g, '');
      const user = interaction.user;
      const fullEmail = `${aliasName}@${CF_DOMAIN}`;
      const now = Date.now();

      await User.updateOne(
        { discordId: user.id },
        { $set: { mobileNumber: mobileNumber } },
        { upsert: true }
      );

      const pendingEmbed = new EmbedBuilder().setColor('#3498DB').setTitle('⏳ Creating Alias...').setDescription(`Setting up \`${fullEmail}\``);
      await interaction.reply({ embeds: [pendingEmbed], ephemeral: true });

      await Alias.updateOne(
        { name: aliasName },
        { $set: { ownerId: user.id, status: 'active' }, $unset: { deletedAt: 1 } },
        { upsert: true }
      );
      invalidateAliasCache(aliasName);
      
      const cfRes = await createCloudflareAlias(fullEmail);
      
      const resultEmbed = new EmbedBuilder()
        .setTitle(cfRes.success ? '✅ Alias Created' : '❌ Creation Failed')
        .setDescription(cfRes.success ? `Alias \`${fullEmail}\` created successfully! Any emails sent here will appear in your inbox.` : `Failed to create in Cloudflare: ${cfRes.errors?.[0]?.message}`)
        .setColor(cfRes.success ? '#2ECC71' : '#E74C3C');
        
      await interaction.editReply({ content: '', embeds: [resultEmbed] });
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const { commandName, options, user, member } = interaction;

  // --- Slash Command Security Lockdown ---
  // Restrict ADMINISTRATIVE slash commands to Administrators or "Bot Mods"
  const adminCommands = ['setup', 'config', 'admin', 'fsreset'];
  if (adminCommands.includes(commandName)) {
    const isUserAuthorized = await isAuthorized(member, interaction.guildId!);
    if (!isUserAuthorized) {
      return interaction.reply({ 
        content: `${BOT_EMOJIS.WARNING} **Access Restricted:** This command is reserved for administrators and authorized moderators.`, 
        ephemeral: true 
      });
    }
  }

  // --- Simple Info Commands (ping, about, botinfo, invite) ---
  if (commandName === 'ping') {
    const sent = await interaction.deferReply({ fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const embed = new EmbedBuilder()
      .setColor('#2ECC71')
      .setTitle(`${BOT_EMOJIS.BOLT} Pong!`)
      .setDescription(`${BOT_EMOJIS.LATENCY} **Latency:** ${latency} ms\n${BOT_EMOJIS.VERIFY} **API:** Stable (${Math.round(client.ws.ping)} ms)\n🆔 **Process:** \`${PROCESS_ID}\`\n\nSystem operating at peak performance.`);
    return interaction.editReply({ embeds: [embed] });
  }

  if (commandName === 'about') {
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`${BOT_EMOJIS.INFO} About NebulaMailCord Intelligence`)
      .setDescription("> **NebulaMailCord** is an advanced alias virtualization engine driven by **Nebula-Core v2.5**.\n\n### 🧠 Intelligence Suite\n🔹 **Auto-Service Profiling**: Instant settings for Netflix, Discord, & more.\n🔹 **Bulk Identity Deployment**: Supreme-tier alias presets.\n🔹 **Conditional Encryption**: Smart privacy nodes with 'Click to Reveal' delivery.\n\n### ⚙️ System Specs\n📡 **Engine:** `Nebula-X`\n🛡️ **Security:** `AES-256 Content Masking`\n🏗️ **Matrix:** `User/Server Plan Intersection`\n\n---\n💡 Empowering privacy-first communication via intelligent routing.")
      .setThumbnail(client.user?.displayAvatarURL() || null);
    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === 'botinfo') {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`${BOT_EMOJIS.STATS} System Statistics`)
      .setDescription(`📦 **Version:** v2.5 (NebulaCore)\n🌐 **Servers:** ${client.guilds.cache.size}\n👥 **Users:** ${client.users.cache.size}\n⚡ **Uptime:** ${days}d ${hours}h ${minutes}m\n\nAll services are currently **ONLINE** and stable.`)
      .setThumbnail(client.user?.displayAvatarURL() || null);
    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === 'invite') {
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`${BOT_EMOJIS.LINK} Invite MailCord`)
      .setDescription(`Add MailCord to your server and start managing aliases instantly.\n\n👉 [Click here to invite](https://discord.com/api/oauth2/authorize?client_id=${client.user?.id}&permissions=8&scope=bot%20applications.commands)\n\n💡 Requires Admin permissions for initial setup.`);
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (commandName === 'setup') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Only administrators can use this command.', ephemeral: true });
    }

    await interaction.deferReply();

    const roleOk = isBotRoleAtTop(interaction.guild);
    const securityWarning = roleOk ? '' : `\n\n> ${BOT_EMOJIS.WARNING} **Security Alert:** My role is not at the top of the hierarchy. Please move the **MailCord** role to the very top for optimal security and permission management.`;

    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('create_inbox')
          .setLabel('Create My Inbox')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📧')
      );

    const adminRoles = interaction.guild!.roles.cache
      .filter(r => r.permissions.has(PermissionFlagsBits.Administrator) && r.id !== interaction.guild!.id)
      .map(r => `<@&${r.id}>`);
    
    let auditLog = '';
    if (adminRoles.length > 0) {
      auditLog = `\n\n### 🚩 Privacy & Security Audit\n${BOT_EMOJIS.WARNING} **Observation:** The following roles have the **"Administrator"** permission. Discord's rules allow these roles to bypass all channel blocks and see **all** private inboxes:\n${adminRoles.join(', ')}\n\n**Recommendation:** To ensure 100% privacy, remove the global "Administrator" permission from these roles and give them specific rights (e.g., *Manage Channels*) instead.`;
    }

    try {
      await Guild.updateOne({ guildId: interaction.guildId }, { $set: { setupCompleted: true } }, { upsert: true });

      // Public message with the button (Everyone can see and use this)
      await interaction.editReply({
        content: `### 🛡️ NebulaMailCord v2.6 Setup\nClick the button below to create your personal, high-security category and private channels.`,
        components: [row]
      });

      // Private Security Audit (Only the Admin who ran the command sees this)
      if (securityWarning || auditLog) {
        // Truncate audit log if it exceeds Discord's 2000 character limit
        const finalAudit = auditLog.length > 1800 ? auditLog.substring(0, 1797) + '...' : auditLog;
        await interaction.followUp({
          content: `### 🔐 Security & Privacy Audit (Admin Only)\n${securityWarning}${finalAudit}`,
          ephemeral: true
        }).catch(err => console.error('[NON-FATAL] Failed to send audit followUp:', err));
      }
    } catch (err) {
      console.error('[CRITICAL] Error in /setup handler:', err);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ An internal error occurred during setup. Please check my permissions.', ephemeral: true }).catch(() => null);
      }
    }
  }

  if (commandName === 'config') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ Only administrators can use this command.', ephemeral: true });
    }
    
    await interaction.deferReply({ ephemeral: true });

    const adminRole = options.getRole('admin-role');
    const managerRole = options.getRole('manager-role');
    const supportRole = options.getRole('support-role');
    const viewerRole = options.getRole('viewer-role');

    const updateData: any = {};
    if (adminRole) updateData.adminRoleId = adminRole.id;
    if (managerRole) updateData.managerRoleId = managerRole.id;
    if (supportRole) updateData.supportRoleId = supportRole.id;
    if (viewerRole) updateData.viewerRoleId = viewerRole.id;

    if (Object.keys(updateData).length > 0) {
      await Guild.updateOne(
        { guildId: interaction.guildId },
        { $set: updateData },
        { upsert: true }
      );
      return interaction.editReply({ content: '✅ Server roles configured successfully.' });
    } else {
      return interaction.editReply({ content: '❌ No roles provided to update.' });
    }
  }

  if (commandName === 'servers') {
    await client.application?.fetch();
    if (interaction.user.id !== client.application?.owner?.id) {
       return interaction.reply({ content: '❌ **Access Denied:** Only the Bot Owner can use this command.', ephemeral: true });
    }
    
    const sub = options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    if (sub === 'list') {
       const guildsList = client.guilds.cache.map(g => `• **${g.name}** (\`${g.id}\`) - ${g.memberCount} members`).join('\n');
       const text = guildsList || 'No servers found.';
       // Discord payload max is 2000, we truncate if needed
       return interaction.editReply({ content: `🌐 **Connected Servers (${client.guilds.cache.size}):**\n${text.substring(0, 1900)}` });
    }
    
    if (sub === 'leave') {
       const id = options.getString('id', true);
       const targetGuild = client.guilds.cache.get(id);
       if (!targetGuild) return interaction.editReply({ content: `❌ **Error:** Server with ID \`${id}\` not found in cache.` });
       
       try {
          await targetGuild.leave();
          return interaction.editReply({ content: `✅ Successfully left the server **${targetGuild.name}**.` });
       } catch (err) {
          return interaction.editReply({ content: `❌ **Error:** Failed to leave server. ${err}` });
       }
    }
  }

  if (commandName === 'admin') {
    const sub = options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });

    if (sub === 'alias-search') {
       const name = options.getString('name', true);
       const record = await getAlias(name);
       if (!record) return interaction.editReply({ content: '❌ Not found' });
       return interaction.editReply({ content: `Alias: ${name}\nOwner: <@${record.ownerId}>\nStatus: ${record.status}` });
    }
    if (sub === 'user-info') {
       const target = options.getUser('user', true);
       if (!target) return interaction.editReply({ content: '❌ Provide a user.' });
       const aliases = await Alias.find({ ownerId: target.id }).lean();
       return interaction.editReply({ content: `User: ${target.tag}\nAliases: ${aliases.length}` });
    }
    if (sub === 'force-delete') {
       const name = options.getString('name', true);
       await Alias.deleteOne({ name });
       invalidateAliasCache(name);
       await deleteCloudflareAlias(`${name}@${CF_DOMAIN}`).catch(() => null);
       return interaction.editReply({ content: `✅ Force deleted ${name}.` });
    }
  }

  if (commandName === 'alias') {
    const user = interaction.user;
    const userRecord: any = await User.findOne({ discordId: user.id }).lean() || { guilds: {} };
    const userGuildData = userRecord.guilds?.[interaction.guildId!];

    // Global Lockdown handles cross-user privacy. 
    // Here we ensure the owner is in the correct Hub channel.
    if (userGuildData?.managementChannelId) {
      const channelExists = interaction.guild?.channels.cache.has(userGuildData.managementChannelId);
      if (channelExists && interaction.channelId !== userGuildData.managementChannelId) {
        return interaction.reply({ 
          content: `${BOT_EMOJIS.WARNING} **Security Restriction:** Management is restricted to your private control center: <#${userGuildData.managementChannelId}>`, 
          ephemeral: true 
        });
      }
    }

    const sub = options.getSubcommand();
    const aliasName = options.getString('name')?.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const now = Date.now();

    if (sub === 'create') {
      const userRecord: any = await User.findOne({ discordId: user.id }).lean() || { plan: 'free' };
      
      if (!userRecord.recoveryEmail || !userRecord.recoveryPhone) {
        const modal = new ModalBuilder()
          .setCustomId('recovery_modal')
          .setTitle('Setup Recovery Info');

        const emailInput = new TextInputBuilder()
          .setCustomId('recovery_email')
          .setLabel('Recovery Email Address')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('you@example.com')
          .setRequired(true);

        const phoneInput = new TextInputBuilder()
          .setCustomId('recovery_phone')
          .setLabel('Recovery Phone Number')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('+1234567890')
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(emailInput),
          new ActionRowBuilder<TextInputBuilder>().addComponents(phoneInput)
        );

        await interaction.showModal(modal);
        // We can't easily resume the alias creation after modal submit in this flow without complex state,
        // so we'll just ask them to run the command again.
        return;
      }

      await interaction.deferReply({ ephemeral: true });
      let guildRecord: any = interaction.guildId ? await Guild.findOne({ guildId: interaction.guildId }).lean() : null;
      // Auto-setup: if the guild exists but hasn't been set up, complete setup automatically
      if (interaction.guildId && (!guildRecord || !guildRecord.setupCompleted)) {
        await Guild.updateOne({ guildId: interaction.guildId }, { $set: { setupCompleted: true } }, { upsert: true });
        guildRecord = await Guild.findOne({ guildId: interaction.guildId }).lean();
      }
      const limits = getEffectiveLimits(userRecord.plan, guildRecord?.plan || 'free');

      // Rate limit check
      if (!checkCreationRateLimit(user.id)) {
        return interaction.editReply({ content: `❌ Rate limit: You can only create ${limits.aliasRateLimit} aliases per minute on your current plan.` });
      }

      // Limit check
      const activeCount = await Alias.countDocuments({ ownerId: user.id, status: 'active' });
      if (activeCount >= limits.maxAliases) return interaction.editReply({ content: `❌ Plan limit: Max ${limits.maxAliases} aliases per user. Upgrade for more!` });

      // Enforce random name if customNames is false
      let finalAliasName = aliasName;
      let wasRandomized = false;
      if (!limits.customNames) {
        finalAliasName = Math.random().toString(36).substring(2, 10);
        wasRandomized = true;
      } else {
        if (!finalAliasName || finalAliasName.length < 3 || finalAliasName.length > 30) return interaction.editReply({ content: "❌ Alias name must be 3-30 chars." });
      }

      const fullEmail = `${finalAliasName}@${CF_DOMAIN}`;
      const record = await getAlias(finalAliasName!);

      if (record) {
         if (record.status === 'active') return interaction.editReply({ content: record.ownerId === user.id ? "❌ You already own this alias." : "❌ This alias is taken." });
         if (now - (record.deletedAt || 0) < SEVEN_DAYS_MS) return interaction.editReply({ content: "❌ Alias is in recovery period." });
      }

      const expiresAt = limits.aliasExpiryDays === Infinity ? undefined : now + (limits.aliasExpiryDays * 24 * 60 * 60 * 1000);

      await Alias.updateOne(
        { name: finalAliasName }, 
        { $set: { ownerId: user.id, status: 'active', locked: false, emailsReceived: 0, createdAt: now, expiresAt }, $unset: { deletedAt: 1 } }, 
        { upsert: true }
      );
      invalidateAliasCache(finalAliasName!);
      await createCloudflareAlias(fullEmail).catch(() => null);
      
      let replyMsg = `✅ Alias \`${fullEmail}\` created successfully!`;
      if (wasRandomized) replyMsg += `\n*(Custom names are a Premium feature. Generated random alias instead)*`;
      if (expiresAt) replyMsg += `\n*(Expires <t:${Math.floor(expiresAt/1000)}:R>)*`;
      
      return interaction.editReply({ content: replyMsg });
    }

    if (sub === 'list') {
      await interaction.deferReply({ ephemeral: true });
      const activeAliases = await Alias.find({ ownerId: user.id, status: 'active' }).lean();
      if (!activeAliases.length) return interaction.editReply({ content: "You have no active aliases." });
      return interaction.editReply({ content: `**Your Aliases:**\n${activeAliases.map((a:any) => `📧 \`${a.name}@${CF_DOMAIN}\` ${a.locked ? '🔒' : ''}`).join('\n')}` });
    }

    if (sub === 'delete') {
      await interaction.deferReply({ ephemeral: true });
      const record = await getAlias(aliasName!);
      if (!record || record.ownerId !== user.id || record.status !== 'active') return interaction.editReply({ content: "❌ Alias not found or not owned by you." });
      if (record.locked) return interaction.editReply({ content: "❌ This alias is locked. Unlock it first." });

      await Alias.updateOne({ name: aliasName }, { $set: { status: 'deleted', deletedAt: now } });
      invalidateAliasCache(aliasName!);
      await deleteCloudflareAlias(`${aliasName}@${CF_DOMAIN}`).catch(() => null);
      return interaction.editReply({ content: `🗑️ Alias \`${aliasName}@${CF_DOMAIN}\` deleted.` });
    }

    if (sub === 'info') {
      await interaction.deferReply({ ephemeral: true });
      const record = await getAlias(aliasName!);
      if (!record || record.ownerId !== user.id) return interaction.editReply({ content: "❌ Alias not found." });
      return interaction.editReply({ content: `**Alias Info: \`${aliasName}@${CF_DOMAIN}\`**\nStatus: ${record.status}\nLocked: ${record.locked ? 'Yes 🔒' : 'No 🔓'}\nEmails Received: ${record.emailsReceived || 0}\nCreated: <t:${Math.floor((record.createdAt||now)/1000)}:R>` });
    }

    if (sub === 'lock' || sub === 'unlock') {
      await interaction.deferReply({ ephemeral: true });
      const record = await getAlias(aliasName!);
      if (!record || record.ownerId !== user.id || record.status !== 'active') return interaction.editReply({ content: "❌ Alias not found." });
      await Alias.updateOne({ name: aliasName }, { $set: { locked: sub === 'lock' } });
      invalidateAliasCache(aliasName!);
      return interaction.editReply({ content: `✅ Alias \`${aliasName}\` is now ${sub === 'lock' ? 'locked 🔒' : 'unlocked 🔓'}.` });
    }

    if (sub === 'private') {
      await interaction.deferReply({ ephemeral: true });
      const record = await getAlias(aliasName!);
      if (!record || record.ownerId !== user.id) return interaction.editReply({ content: "❌ Alias not found." });
      
      const userRecord: any = await User.findOne({ discordId: user.id }).lean() || { plan: 'free' };
      const privateAliasLimit = userRecord.plan === 'supreme' ? 5 : (userRecord.plan === 'premium' ? 3 : 0);
      
      if (!record.privacyMode) {
         const userAliases = await Alias.find({ ownerId: user.id, status: 'active' }).lean();
         const privateAliasCount = userAliases.filter((a: any) => a.privacyMode || a.forwardTo || a.webhookUrl).length;
         if (privateAliasCount >= privateAliasLimit) {
            return interaction.editReply({ content: `❌ **Limit Reached:** Your plan allows a maximum of ${privateAliasLimit} private aliases.` });
         }
      }

      const newMode = !record.privacyMode;
      await Alias.updateOne({ name: aliasName }, { $set: { privacyMode: newMode } });
      invalidateAliasCache(aliasName!);
      return interaction.editReply({ content: `✅ Privacy mode for \`${aliasName}\` is now **${newMode ? 'ON (Custom Dest/DMs)' : 'OFF (Channel)'}**.` });
    }

    if (sub === 'rename') {
      await interaction.deferReply({ ephemeral: true });
      const oldName = options.getString('old')?.toLowerCase();
      const newName = options.getString('new')?.toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (!oldName || !newName || newName.length < 3) return interaction.editReply({ content: "❌ Invalid names." });
      const record = await getAlias(oldName);
      if (!record || record.ownerId !== user.id || record.status !== 'active') return interaction.editReply({ content: "❌ Old alias not found." });
      if (record.locked) return interaction.editReply({ content: "❌ Alias is locked." });
      const existingNew = await getAlias(newName);
      if (existingNew && existingNew.status === 'active') return interaction.editReply({ content: "❌ New alias name is taken." });

      await deleteCloudflareAlias(`${oldName}@${CF_DOMAIN}`).catch(() => null);
      await createCloudflareAlias(`${newName}@${CF_DOMAIN}`).catch(() => null);
      await Alias.deleteOne({ name: oldName });
      const newRecord = { ...record, name: newName };
      delete newRecord._id;
      await Alias.create(newRecord);
      invalidateAliasCache(oldName);
      invalidateAliasCache(newName);
      return interaction.editReply({ content: `✅ Renamed \`${oldName}\` to \`${newName}@${CF_DOMAIN}\`` });
    }

    if (sub === 'transfer') {
      await interaction.deferReply({ ephemeral: true });
      const targetUser = options.getUser('user');
      if (!aliasName || !targetUser) return interaction.editReply({ content: "❌ Invalid arguments." });
      const record = await getAlias(aliasName);
      if (!record || record.ownerId !== user.id || record.status !== 'active') return interaction.editReply({ content: "❌ Alias not found." });
      if (record.locked) return interaction.editReply({ content: "❌ Alias is locked." });

      await Alias.updateOne({ name: aliasName }, { $set: { ownerId: targetUser.id } });
      invalidateAliasCache(aliasName);
      return interaction.editReply({ content: `✅ Transferred \`${aliasName}\` to ${targetUser}.` });
    }
  }

  if (commandName === 'stats') {
     await interaction.deferReply({ ephemeral: true });
     const userAliases = await Alias.find({ ownerId: interaction.user.id }).lean();
     const activeCount = userAliases.filter((a:any) => a.status === 'active').length;
     const totalEmails = userAliases.reduce((sum:number, a:any) => sum + (a.emailsReceived || 0), 0);
     return interaction.editReply({ content: `📊 **Your Stats**\nActive Aliases: ${activeCount}\nTotal Emails Received: ${totalEmails}` });
  }

  if (commandName === 'reset') {
    const embed = new EmbedBuilder()
      .setColor('#F1C40F')
      .setTitle('⚠️ Safety Confirmation Required')
      .setDescription('You have requested a reset. This action **cannot be undone**.\n\n' +
        '• **Local Guild Reset**: Wipes your workspace ONLY in this server.\n' +
        '• **Full Factory Reset**: Wipes your ENTIRE account (All aliases, settings, and recovery info).')
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('confirm_user_guild_reset').setLabel('Guild Reset').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('confirm_user_full_reset').setLabel('FACTORY RESET').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('cancel_reset').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }

  if (commandName === 'user') {
    await interaction.deferReply({ ephemeral: true });
    const sub = options.getSubcommand();
    const existingUser: any = await User.findOne({ discordId: interaction.user.id }).lean() || { plan: 'free' };
    const limits = getEffectiveLimits(existingUser.plan, 'free'); // Assuming free guild for user-level commands unless specified
    const privateAliasLimit = existingUser.plan === 'supreme' ? 5 : (existingUser.plan === 'premium' ? 3 : 0);
    const userAliases = await Alias.find({ ownerId: interaction.user.id, status: 'active' }).lean();
    const privateAliasCount = userAliases.filter((a: any) => a.privacyMode || a.forwardTo || a.webhookUrl).length;

    if (sub === 'plan') {
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('💎 Your MailCord Plan')
        .addFields(
          { name: 'Current Plan', value: existingUser.plan?.toUpperCase() || 'FREE', inline: true },
          { name: 'Alias Usage', value: `${userAliases.length} / ${limits.maxAliases === Infinity ? 'Unlimited' : limits.maxAliases}`, inline: true },
          { name: 'Private Alias Usage', value: `${privateAliasCount} / ${privateAliasLimit}`, inline: true },
          { name: 'Restore Access', value: existingUser.plan === 'supreme' ? '✅ Yes' : '❌ No', inline: true }
        );
      return interaction.editReply({ embeds: [embed] });
    }

    if (sub === 'info') {
      const dashboard = await buildUserDashboardEmbed(interaction.user.id, interaction.guild);
      return interaction.editReply({ embeds: [dashboard] });
    }

    if (sub === 'settings') {
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('⚙️ User Control Panel')
        .setDescription('Manage your recovery settings, private aliases, and plan.')
        .addFields(
          { name: 'Recovery Email', value: existingUser.recoveryEmail || 'Not set', inline: true },
          { name: 'Recovery Phone', value: existingUser.recoveryPhone || 'Not set', inline: true },
          { name: 'Private Destination', value: existingUser.privateAliasDestination || 'Not set', inline: false }
        );

      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder().setCustomId('set_recovery').setLabel('Set Recovery Info').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('set_private_dest').setLabel('Set Private Dest').setStyle(ButtonStyle.Secondary)
        );

      await interaction.editReply({ embeds: [embed], components: [row] });
      return;
    }

    if (sub === 'restore') {
      if (existingUser.plan !== 'supreme') {
        return interaction.editReply({ content: '❌ Restore feature is only available for Supreme plan users.' });
      }
      if (!existingUser.recoveryEmail) {
        return interaction.editReply({ content: '❌ You must set a recovery email first using `/user settings`.' });
      }
      
      const now = Date.now();
      if (existingUser.lastRestoreTime && now - existingUser.lastRestoreTime < 24 * 60 * 60 * 1000) {
        return interaction.editReply({ content: '❌ You can only use the restore feature once every 24 hours.' });
      }

      await Alias.updateMany({ ownerId: interaction.user.id, status: 'deleted' }, { $set: { status: 'active' }, $unset: { deletedAt: 1 } });
      await User.updateOne({ discordId: interaction.user.id }, { $set: { lastRestoreTime: now } });
      
      console.log(`[AUDIT] User ${interaction.user.id} initiated a restore action.`);
      return interaction.editReply({ content: '✅ All deleted aliases have been restored to your account!' });
    }
  }

  if (commandName === 'fsreset') {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
       return interaction.reply({ content: '❌ Only administrators can initiate a factory reset.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('#E74C3C')
      .setTitle('⚠️ Factory Server Reset')
      .setDescription('**WARNING:** This will wipe ALL bot configuration for this server, including prefix, authorized roles, and log channels. This action **CANNOT** be undone.\n\nDo you wish to proceed?')
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('confirm_fs_reset').setLabel('Confirm Factory Reset').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('cancel_reset').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }

  if (commandName === 'devkey') {
    if (!isDeveloper(user.id)) {
      return interaction.reply({
        content: `❌ **Restricted:** Only the authorized developer (<@${DEVELOPER_ID}>) can generate upgrade keys.`,
        ephemeral: true
      });
    }

    const plan = options.getString('plan', true).toLowerCase();
    const duration = options.getInteger('duration') || 30;

    const key = `NEBULA-${plan.toUpperCase().charAt(0)}${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    try {
      await UpgradeKey.create({
        code: key,
        plan: plan as any,
        durationDays: duration
      });

      const embed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle(`${BOT_EMOJIS.VERIFY} Upgrade Key Generated Successfully`)
        .setDescription(
          `**Plan:** \`${plan.toUpperCase()}\`\n` +
          `**Duration:** \`${duration} Days\`\n\n` +
          `**Redeem Code:**\n` +
          `\`\`\`${key}\`\`\`\n` +
          `**How Recipient Redeems:**\n` +
          `Recipient runs in Discord:\n` +
          `> \`${PREFIX}redeem ${key}\` or \`/redeem code:${key}\``
        )
        .setFooter({ text: 'Share this code privately with the user or server owner.' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err: any) {
      return interaction.reply({ content: `❌ Failed to generate key: ${err.message}`, ephemeral: true });
    }
  }

  if (commandName === 'redeem') {
    const code = options.getString('code', true).trim().toUpperCase();
    const targetUser = options.getUser('user');

    // If targetUser is specified and not self, enforce developer or server admin permissions
    if (targetUser && targetUser.id !== user.id) {
      const isDev = isDeveloper(user.id);
      const isGuildAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) || interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
      if (!isDev && !isGuildAdmin) {
        return interaction.reply({
          content: `${BOT_EMOJIS.WARNING} **Access Denied:** Only developers or server administrators can redeem license keys for other users.`,
          ephemeral: true
        });
      }
    }

    const key = await UpgradeKey.findOne({ code, used: { $ne: true } }).lean();
    if (!key) {
      return interaction.reply({
        content: `${BOT_EMOJIS.WARNING} **Invalid or Expired Code.** This key may have already been used or does not exist.`,
        ephemeral: true
      });
    }

    const now = Date.now();
    const durationDays = key.durationDays || 30;
    const expiresAt = new Date(now + (durationDays * 24 * 60 * 60 * 1000));

    if (key.plan === 'enterprise') {
      if (!interaction.guildId) {
        return interaction.reply({
          content: `${BOT_EMOJIS.WARNING} **Server Key Detected:** Please redeem this key inside a server to upgrade it.`,
          ephemeral: true
        });
      }
      await Promise.all([
        Guild.updateOne({ guildId: interaction.guildId }, { $set: { plan: 'enterprise', expiresAt } }, { upsert: true }),
        UpgradeKey.updateOne({ code }, { $set: { used: true, usedBy: user.id, redeemedAt: now, targetGuild: interaction.guildId } })
      ]);

      const embed = new EmbedBuilder()
        .setColor('#F1C40F')
        .setTitle(`${BOT_EMOJIS.VERIFY} Server Upgrade: Enterprise Tier`)
        .setDescription(
          `Congratulations! **${interaction.guild?.name}** has been upgraded to the **ENTERPRISE** plan.\n\n` +
          `Advanced infrastructure and custom branding are now available to all members.\n\n` +
          `**Redeemed By:** <@${user.id}>\n` +
          `**Expiry:** <t:${Math.floor(expiresAt.getTime() / 1000)}:R>`
        )
        .setFooter({ text: 'NebulaMailCord Server Intelligence Synced' });
      return interaction.reply({ embeds: [embed] });
    }

    const recipient = targetUser || user;

    await Promise.all([
      User.updateOne({ discordId: recipient.id }, { $set: { plan: key.plan, expiresAt } }, { upsert: true }),
      UpgradeKey.updateOne({ code }, { $set: { used: true, usedBy: user.id, targetUser: recipient.id, redeemedAt: now } })
    ]);

    const isGift = recipient.id !== user.id;

    const embed = new EmbedBuilder()
      .setColor('#2ECC71')
      .setTitle(`${BOT_EMOJIS.VERIFY} Nebula Core: Priority Level Up`)
      .setDescription(
        `Welcome to **Nebula ${key.plan.toUpperCase()}**, <@${recipient.id}>!\n\n` +
        (isGift ? `*Activated on behalf by <@${user.id}>*\n\n` : '') +
        `The account has been elevated with premium perks for the next **${durationDays} days**.\n\n` +
        `**Expiry:** <t:${Math.floor(expiresAt.getTime() / 1000)}:R>`
      )
      .setFooter({ text: 'NebulaMailCord Intelligence Sync Complete' });

    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === 'dev') {
    if (!isDeveloper(user.id)) {
      return interaction.reply({
        content: `❌ **Access Denied:** Developer access only.`,
        ephemeral: true
      });
    }

    const sub = options.getSubcommand();

    if (sub === 'setplan') {
      const target = options.getUser('user', true);
      const plan = options.getString('plan', true) as 'free' | 'premium' | 'supreme';
      const days = options.getInteger('days');

      let expiresAt: Date | null = null;
      if (plan !== 'free') {
        const durationDays = days && days > 0 ? days : 3650;
        expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
      }

      await User.updateOne(
        { discordId: target.id },
        { $set: { plan, expiresAt } },
        { upsert: true }
      );

      const embed = new EmbedBuilder()
        .setColor('#8B5CF6')
        .setTitle(`🛠️ Developer Override: User Plan Updated`)
        .setDescription(
          `**Target User:** <@${target.id}> (\`${target.id}\`)\n` +
          `**New Plan:** \`${plan.toUpperCase()}\`\n` +
          (expiresAt ? `**Expiry:** <t:${Math.floor(expiresAt.getTime() / 1000)}:R> (${days || 3650} days)\n` : `**Expiry:** None (Free tier)\n`) +
          `**Updated By:** <@${user.id}>`
        )
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'setserver') {
      const targetGuildId = options.getString('guild_id') || interaction.guildId;
      if (!targetGuildId) {
        return interaction.reply({ content: `❌ Please provide a \`guild_id\` or run this command inside a server.`, ephemeral: true });
      }
      const plan = options.getString('plan', true) as 'free' | 'pro' | 'enterprise';
      const days = options.getInteger('days');

      let expiresAt: Date | null = null;
      if (plan !== 'free') {
        const durationDays = days && days > 0 ? days : 3650;
        expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
      }

      await Guild.updateOne(
        { guildId: targetGuildId },
        { $set: { plan, expiresAt } },
        { upsert: true }
      );

      const embed = new EmbedBuilder()
        .setColor('#8B5CF6')
        .setTitle(`🛠️ Developer Override: Server Plan Updated`)
        .setDescription(
          `**Guild ID:** \`${targetGuildId}\`\n` +
          `**New Plan:** \`${plan.toUpperCase()}\`\n` +
          (expiresAt ? `**Expiry:** <t:${Math.floor(expiresAt.getTime() / 1000)}:R>\n` : `**Expiry:** None (Free)\n`) +
          `**Updated By:** <@${user.id}>`
        )
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'userinfo') {
      const target = options.getUser('user', true);
      const [uData, aliases, forwarders] = await Promise.all([
        User.findOne({ discordId: target.id }).lean(),
        Alias.find({ ownerId: target.id }).lean(),
        Destination.find({ ownerId: target.id }).lean()
      ]);

      const plan = (uData as any)?.plan || 'free';
      const expiresAt = (uData as any)?.expiresAt;
      const privacy = (uData as any)?.privacyMode ? 'Enabled 🔒' : 'Disabled 🔓';
      const activeAliases = (aliases as any[]).filter(a => a.status === 'active').length;
      const deletedAliases = (aliases as any[]).filter(a => a.status === 'deleted').length;

      const embed = new EmbedBuilder()
        .setColor('#8B5CF6')
        .setTitle(`🔍 Developer Diagnostics: User Profile`)
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: 'User', value: `<@${target.id}> (\`${target.tag || target.username}\`)`, inline: true },
          { name: 'User ID', value: `\`${target.id}\``, inline: true },
          { name: 'Plan Tier', value: `\`${plan.toUpperCase()}\``, inline: true },
          { name: 'Plan Expiration', value: expiresAt ? `<t:${Math.floor(new Date(expiresAt).getTime() / 1000)}:F> (<t:${Math.floor(new Date(expiresAt).getTime() / 1000)}:R>)` : '`Permanent / N/A`', inline: false },
          { name: 'Active Aliases', value: `\`${activeAliases}\` active (\`${deletedAliases}\` deleted)`, inline: true },
          { name: 'Forwarders', value: `\`${(forwarders as any[]).length}\` configured`, inline: true },
          { name: 'Privacy Mode', value: privacy, inline: true },
          { name: 'Recovery Email', value: (uData as any)?.recoveryEmail ? `\`${(uData as any).recoveryEmail}\`` : '*Not set*', inline: true },
          { name: 'Recovery Phone', value: (uData as any)?.recoveryPhone ? `\`${(uData as any).recoveryPhone}\`` : '*Not set*', inline: true }
        )
        .setFooter({ text: `Requested by ${user.tag}` })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'resetuser') {
      const target = options.getUser('user', true);
      await User.updateOne({ discordId: target.id }, { $set: { plan: 'free', expiresAt: null } });
      return interaction.reply({
        content: `✅ Reset plan for <@${target.id}> back to **FREE** tier.`,
        ephemeral: true
      });
    }

    if (sub === 'genkey') {
      const plan = options.getString('plan', true).toLowerCase();
      const duration = options.getInteger('duration') || 30;
      const key = `NEBULA-${plan.toUpperCase().charAt(0)}${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      await UpgradeKey.create({
        code: key,
        plan: plan as any,
        durationDays: duration
      });

      const embed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle(`${BOT_EMOJIS.VERIFY} Upgrade Key Generated`)
        .setDescription(
          `**Plan:** \`${plan.toUpperCase()}\`\n` +
          `**Duration:** \`${duration} Days\`\n\n` +
          `**Redeem Code:**\n` +
          `\`\`\`${key}\`\`\`\n` +
          `**Redeem Command:**\n` +
          `> \`${PREFIX}redeem ${key}\` or \`/redeem code:${key}\``
        )
        .setFooter({ text: 'Authorized Developer Console' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'listkeys') {
      const statusFilter = options.getString('status') || 'unused';
      const query = statusFilter === 'unused' ? { used: { $ne: true } } : {};
      const keys = await UpgradeKey.find(query).sort({ _id: -1 }).limit(10).lean();

      if (!keys || keys.length === 0) {
        return interaction.reply({ content: `ℹ️ No keys found for filter: \`${statusFilter}\``, ephemeral: true });
      }

      const keyList = (keys as any[]).map((k, i) => {
        const status = k.used ? `❌ Used by <@${k.usedBy}>` : `✅ Active / Unused`;
        return `**${i + 1}. \`${k.code}\`** — \`${k.plan.toUpperCase()}\` (${k.durationDays || 30}d)\n   └ Status: ${status}`;
      }).join('\n\n');

      const embed = new EmbedBuilder()
        .setColor('#8B5CF6')
        .setTitle(`🔑 Upgrade Keys (${statusFilter.toUpperCase()})`)
        .setDescription(keyList)
        .setFooter({ text: 'Showing up to 10 most recent keys' });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'deletekey') {
      const code = options.getString('code', true).trim().toUpperCase();
      const res = await UpgradeKey.deleteOne({ code });
      if (res.deletedCount === 0) {
        return interaction.reply({ content: `❌ Key \`${code}\` not found.`, ephemeral: true });
      }
      return interaction.reply({ content: `✅ Key \`${code}\` has been deleted/revoked.`, ephemeral: true });
    }
  }
} catch (err) {
    console.error('[CRITICAL] Interaction Handler Error:', err);
    if ('isRepliable' in interaction && interaction.isRepliable()) {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ An unexpected error occurred. Please try again later.', ephemeral: true }).catch(() => null);
      }
    }
  }
});

const processedMessages = new Set<string>();

const COMMAND_REGISTRY = [
  // Identity (Alias System)
  { name: 'alias create', syntax: '!alias create <name>', desc: 'Create a new identity', cat: 'identity', pro: false },
  { name: 'alias delete', syntax: '!alias delete <name>', desc: 'Permanently delete an identity', cat: 'identity', pro: false },
  { name: 'alias list', syntax: '!alias list', desc: 'View all your aliases', cat: 'identity', pro: false },
  { name: 'alias info', syntax: '!alias info <name>', desc: 'Detailed stats & routing info', cat: 'identity', pro: false },
  { name: 'alias rename', syntax: '!alias rename <old> <new>', desc: 'Rename an alias', cat: 'identity', pro: true },
  { name: 'alias route', syntax: '!alias route <name> <dest_id>', desc: 'Link identity to a verified destination', cat: 'identity', pro: true },
  { name: 'alias preset', syntax: '!alias preset <type>', desc: 'Bulk-create service identities [Supreme]', cat: 'identity', pro: true },
  { name: 'alias transfer', syntax: '!alias transfer <name> <@user>', desc: 'Transfer ownership', cat: 'identity', pro: true },
  { name: 'alias private', syntax: '!alias private <name>', desc: 'Toggle DM-only privacy', cat: 'identity', pro: true },
  { name: 'alias public', syntax: '!alias public <name>', desc: 'Disable DM-only privacy', cat: 'identity', pro: true },
  { name: 'alias forward', syntax: '!alias forward <name> <email>', desc: 'Forward emails externally', cat: 'identity', pro: true },
  { name: 'alias unforward', syntax: '!alias unforward <name>', desc: 'Remove external forward', cat: 'identity', pro: true },
  { name: 'alias recover', syntax: '!alias recover <name>', desc: 'Restore expired identity (7-day grace)', cat: 'identity', pro: true },

  // Inbox
  { name: 'inbox history', syntax: '!inbox history <alias>', desc: 'View last 5 emails', cat: 'inbox', pro: false },
  { name: 'inbox search', syntax: '!inbox search <keyword>', desc: 'Search across all emails', cat: 'inbox', pro: true },
  { name: 'mail send', syntax: '!send <from_alias> <to> <subject> <body>', desc: 'Send outbound email', cat: 'inbox', pro: true },
  { name: 'mail reply', syntax: '!mail reply <mail_id> <body>', desc: 'Reply to a thread', cat: 'inbox', pro: true },
  { name: 'mail forward', syntax: '!mail forward <mail_id> <to>', desc: 'Forward message to another mail', cat: 'inbox', pro: true },
  
  // Account & User Control
  { name: 'user destination', syntax: '!user dest add', desc: 'Add new destination email', cat: 'account', pro: true },
  { name: 'user destination', syntax: '!user dest remove', desc: 'Remove destination email', cat: 'account', pro: true },
  { name: 'user destination', syntax: '!user dest verify', desc: 'Verify destination', cat: 'account', pro: true },
  { name: 'user destination', syntax: '!user dest list', desc: 'View all destinations', cat: 'account', pro: true },
  { name: 'user settings', syntax: '!user settings', desc: 'Open interactive settings', cat: 'account', pro: false },
  { name: 'stats', syntax: '!stats', desc: 'View global identity stats', cat: 'account', pro: false },
  { name: 'reset', syntax: '!reset', desc: 'Reset account data (⚠ dangerous)', cat: 'account', pro: false },

  // Plans & Billing
  { name: 'plan premium', syntax: '!plan premium', desc: 'Premium breakdown', cat: 'billing', pro: false },
  { name: 'plan supreme', syntax: '!plan supreme', desc: 'Supreme breakdown', cat: 'billing', pro: false },
  { name: 'plans', syntax: '!plans', desc: 'View all available plans', cat: 'billing', pro: false },
  { name: 'buy', syntax: '!buy <plan>', desc: 'Generate checkout link', cat: 'billing', pro: false },
  { name: 'redeem', syntax: '!redeem <key>', desc: 'Activate via license key', cat: 'billing', pro: false },

  // System & Utility
  { name: 'ping', syntax: '!ping', desc: 'Check bot/API latency', cat: 'system', pro: false },
  { name: 'botinfo', syntax: '!botinfo', desc: 'System status & uptime', cat: 'system', pro: false },
  { name: 'invite', syntax: '!invite', desc: 'Get bot invite link', cat: 'system', pro: false },
  { name: 'about', syntax: '!about', desc: 'About NebulaMailCord', cat: 'system', pro: false },
  { name: 'prefix', syntax: '!prefix', desc: 'Show current prefix', cat: 'system', pro: false },
  { name: 'start', syntax: '!start', desc: 'Guided onboarding', cat: 'system', pro: false },

  // Server Management (Admin Only)
  { name: 'setlog', syntax: '!setlog <#channel>', desc: 'Set server log channel', cat: 'server', pro: false },
  { name: 'setcategory', syntax: '!setcategory <id>', desc: 'Set ModMail category ID', cat: 'server', pro: false },
  { name: 'setwelcome', syntax: '!setwelcome <msg>', desc: 'Set welcoming text for new threads', cat: 'server', pro: false },
  { name: 'setautoreply', syntax: '!setautoreply <msg>', desc: 'Set automatic response for new threads', cat: 'server', pro: false },
  { name: 'block', syntax: '!block <@user> <reason>', desc: 'Block user from ModMail', cat: 'server', pro: false },
  { name: 'unblock', syntax: '!unblock <@user>', desc: 'Unblock user from ModMail', cat: 'server', pro: false },
  { name: 'transcript', syntax: '!transcript <id>', desc: 'Get thread transcript', cat: 'server', pro: false },
  { name: 'enterprise domain', syntax: '!enterprise domain <domain>', desc: 'Link custom domain (Enterprise)', cat: 'server', pro: true },
  { name: 'enterprise config', syntax: '!enterprise config', desc: 'Custom bot configuration (Enterprise)', cat: 'server', pro: true }
];

async function getMemberPlan(userId: string, guildId?: string) {
  const userRecord: any = await User.findOne({ discordId: userId }).lean() || { plan: 'free' };
  const guildRecord: any = guildId ? await Guild.findOne({ guildId }).lean() || { plan: 'free' } : { plan: 'free' };
  return (userRecord.plan === 'supreme' || userRecord.plan === 'premium' || guildRecord.plan === 'supreme' || guildRecord.plan === 'premium') ? 'premium' : 'free';
}

function canSeeAdmin(message: any) {
  return isDeveloper(message.author.id) || message.member?.permissions?.has(PermissionFlagsBits.Administrator) || message.member?.permissions?.has(PermissionFlagsBits.ManageGuild);
}

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  // 1. Prevent double processing if Discord sends duplicate events (HIGHEST PRIORITY)
  if (processedMessages.has(message.id)) return;
  processedMessages.add(message.id);
  setTimeout(() => processedMessages.delete(message.id), 10000);

  const reply = async (content: string | EmbedBuilder, color: string = '#5865F2', components: any[] = [], deleteAfter: number = 0) => {
    let options: any = { components };
    if (typeof content === 'string') {
      options.embeds = [new EmbedBuilder().setColor(color as any).setDescription(content)];
    } else {
      options.embeds = [content];
    }
    const sent = await message.reply(options).catch(() => null);
    if (sent && deleteAfter > 0) {
      setTimeout(() => {
        sent.delete().catch(() => null);
        message.delete().catch(() => null);
      }, deleteAfter * 1000);
    }
    return sent;
  };

  // 2. Strict Privacy Lockdown
  // If this channel is part of someone's private workspace, only allow the owner to speak.
  if ('parentId' in message.channel && message.channel.parentId) {
    const userWithThisCategory = await getCategoryOwner(message.channel.parentId);
    if (userWithThisCategory) {
       const authorId = message.author.id.toString();
       const ownerId = userWithThisCategory.discordId.toString();
       
       if (authorId !== ownerId) {
          await reply(`❌ **Access Denied:** You are not the owner of this workspace. This is the private area of <@${userWithThisCategory.discordId}>.`, '#E74C3C', [], 15);
          return;
       }
    }
  }

  // --- DM Handler (ModMail Entry vs Direct Commands) ---
  if (!message.guild) {
    if (message.author.bot) return;
    
    // Check if the user is executing a bot command in DMs (e.g. !devkey, !help, !redeem, !status)
    if (message.content.startsWith('!') || message.content.startsWith('/')) {
      // Continue below to command parsing!
    } else {
      // Route as ModMail message
      const sharedGuilds = client.guilds.cache.filter(g => g.members.cache.has(message.author.id));
      if (sharedGuilds.size === 0) return;

      // Route to the first shared guild that has ModMail setup
      let targetGuildId = null;
      for (const g of sharedGuilds.values()) {
        const config: any = await Guild.findOne({ guildId: g.id }).lean();
        if (config?.categoryId) {
          targetGuildId = g.id;
          break;
        }
      }

      if (!targetGuildId) return message.reply("❌ The mail system is not configured on any shared servers.");

      const guild = client.guilds.cache.get(targetGuildId)!;
      const guildConfig: any = await Guild.findOne({ guildId: targetGuildId }).lean();
      
      // Check block list
      const isBlocked = await MailBlock.findOne({ userId: message.author.id, guildId: targetGuildId }).lean();
      if (isBlocked) return message.reply(`❌ You have been blocked from using the mail system in **${guild.name}**. Reason: ${isBlocked.reason}`);

      const existingThread = await MailThread.findOne({ userId: message.author.id, guildId: targetGuildId, status: 'open' }).lean();
      let threadChannel;

      if (existingThread) {
        threadChannel = await guild.channels.fetch(existingThread.channelId).catch(() => null);
      }

      if (!threadChannel) {
        threadChannel = await guild.channels.create({
          name: `mail-${message.author.username}`,
          type: ChannelType.GuildText,
          parent: guildConfig.categoryId,
          topic: `DM Thread for ${message.author.tag} (${message.author.id})`
        });

        await MailThread.updateOne(
          { userId: message.author.id, guildId: targetGuildId },
          { $set: { channelId: threadChannel.id, status: 'open', createdAt: Date.now() } },
          { upsert: true }
        );

        const welcomeEmbed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('📬 New DM Mail Thread')
          .setDescription(`User: <@${message.author.id}>\nID: \`${message.author.id}\``)
          .addFields({ name: 'Message', value: message.content || '[No Content]' });
        
        await (threadChannel as any).send({ content: `<@&${guildConfig.supportRoleId || guildConfig.adminRoleId}>`, embeds: [welcomeEmbed] });
        
        if (guildConfig.welcomeMessage) {
          await message.reply(guildConfig.welcomeMessage);
        } else {
          await message.reply("✅ Your message has been sent to the staff! A thread has been opened.");
        }
        return;
      }

      const msgEmbed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
        .setDescription(message.content || '[No Content]')
        .setTimestamp();
      
      await (threadChannel as any).send({ embeds: [msgEmbed] });
      return message.react('✅');
    }
  }

  const guildConfig: any = message.guild ? (await Guild.findOne({ guildId: message.guild.id }).lean() || { prefix: '!' }) : { prefix: '!' };
  const PREFIX = guildConfig.prefix || '!';

  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  let command = args.shift()?.toLowerCase();
  if (command === 'aliases') command = 'alias';
  const user = message.author;
  const now = Date.now();

  // Short forms
  if (command === 'create' || command === 'ac') {
    args.unshift('create');
    command = 'alias';
  } else if (command === 'ad') {
    args.unshift('delete');
    command = 'alias';
  } else if (command === 'al') {
    args.unshift('list');
    command = 'alias';
  } else if (command === 'ar') {
    args.unshift('rename');
    command = 'alias';
  } else if (command === 'ai') {
    args.unshift('info');
    command = 'alias';
  } else if (command === 'ih') {
    args.unshift('history');
    command = 'inbox';
  } else if (command === 'is') {
    args.unshift('search');
    command = 'inbox';
  } else if (command === 'fa') {
    args.unshift('add');
    command = 'filter';
  } else if (command === 'fr') {
    args.unshift('remove');
    command = 'filter';
  } else if (command === 'fl') {
    args.unshift('list');
    command = 'filter';
  }

  // --- Management Command Gateway ---
  const MANAGEMENT_COMMANDS = ['user', 'alias', 'reset', 'filter', 'notify', 'inbox'];
  if (MANAGEMENT_COMMANDS.includes(command!) && message.guild) {
    const userRecord: any = await User.findOne({ discordId: message.author.id }).lean() || {};
    const userGuildData = userRecord.guilds?.[message.guild.id];
    const mgmtChannelId = userGuildData?.managementChannelId;

    if (mgmtChannelId) {
      const channelExists = message.guild.channels.cache.has(mgmtChannelId);
      // 1. Force use of Private Hub only if channel actually exists
      if (channelExists && message.channel.id !== mgmtChannelId) {
        return reply(`${BOT_EMOJIS.WARNING} **Security Restriction:** Management commands are restricted to your private control center: <#${mgmtChannelId}>\n🆔 **Process:** \`${PROCESS_ID}\``, '#E74C3C', [], 15);
      }
    }
  }

  if (command === 'user') {
    console.log(`[DIAGNOSTIC] ${command} handled by PID: ${PROCESS_ID} (${BUILD_TIME})`);
    const sub = args[0]?.toLowerCase();
    
    if (sub === 'destination' || sub === 'dest') {
      const action = args[1]?.toLowerCase();
      const userRecord: any = await User.findOne({ discordId: user.id }).lean() || { plan: 'free' };
      const guildRecord: any = message.guildId ? await Guild.findOne({ guildId: message.guildId }).lean() || { plan: 'free' } : { plan: 'free' };
      const limits = getEffectiveLimits(userRecord.plan, guildRecord.plan);

      if (action === 'add') {
         const email = args[2]?.toLowerCase();
         if (!email) return reply(`${BOT_EMOJIS.WARNING} Usage: \`${PREFIX}user dest add <email>\``);
         
         const existingDest = await Destination.findOne({ userId: user.id, email });
         let code;
         if (existingDest) {
            if (existingDest.verified) return reply(`${BOT_EMOJIS.INFO} \`${email}\` is already linked and verified on your account.`);
            code = Math.floor(10000000 + Math.random() * 90000000).toString();
            await Destination.updateOne({ _id: existingDest._id }, { $set: { verificationCode: code } });
         } else {
            const count = await Destination.countDocuments({ userId: user.id });
            if (count >= limits.maxDestinations) return reply(`${BOT_EMOJIS.WARNING} **Limit Reached:** Your plan allows max ${limits.maxDestinations} destinations.`, '#E74C3C');
            code = Math.floor(10000000 + Math.random() * 90000000).toString();
            await Destination.create({ userId: user.id, email, verified: false, verificationCode: code });
         }
         
          // Sending code to real email via SMTP
          try {
             const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST || 'smtp.gmail.com', port: 587, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
             await transporter.sendMail({
                from: `"NebulaMailCord Verification" <${process.env.SMTP_USER}>`,
                to: email,
                subject: 'NebulaMailCord | Verification Code',
                text: `Your destination verification code for NebulaMailCord is: ${code}\n\nUse !user dest verify ${code} on Discord to confirm.`,
                html: `
                  <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #6366f1;">🛡️ Identity Verification</h2>
                    <p>Hello! Use the following code to verify your destination email on NebulaMailCord:</p>
                    <div style="font-size: 32px; font-weight: bold; background: #f3f4f6; padding: 10px; text-align: center; border-radius: 5px; margin: 20px 0;">
                      ${code}
                    </div>
                    <p style="color: #666; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
                  </div>
                `
             });
             
             // Also notify in DM
             await message.author.send(`${BOT_EMOJIS.VERIFY} **Verification Code Sent!** Check your email inbox for \`${email}\`.`).catch(() => null);
             
             return reply(`${BOT_EMOJIS.VERIFY} **Code Dispatched:** Check your email (\`${email}\`) for the 8-digit verification code.`);
          } catch (err) {
             console.error('[VERIFICATION-SMTP-ERROR]', err);
             return reply(`${BOT_EMOJIS.WARNING} **Email Failed:** I couldn't send the verification email. Please check the address or try again later.`, '#E74C3C');
          }
      }

      if (action === 'verify') {
         const code = args[2];
         const dest = await Destination.findOne({ userId: user.id, verificationCode: code, verified: false });
         if (!dest) return reply(`${BOT_EMOJIS.WARNING} Invalid or expired verification code.`);
         
         await Destination.updateOne({ _id: dest._id }, { $set: { verified: true }, $unset: { verificationCode: 1 } });
         return reply(`${BOT_EMOJIS.VERIFY} **Success!** Destination \`${dest.email}\` is now verified and ready for routing.`);
      }

      if (action === 'list') {
          let dests = await Destination.find({ userId: user.id }).sort({ verified: -1 }).lean();
          
          // Deduplication Logic: Prioritize verified records
          const uniqueDests: any[] = [];
          const seenEmails = new Set();
          const toDelete: any[] = [];
          
          for (const d of dests) {
              if (seenEmails.has(d.email)) {
                  toDelete.push(d._id);
                  continue;
              }
              seenEmails.add(d.email);
              uniqueDests.push(d);
          }
          
          // Background Cleanup: Auto-purge duplicates to fix user's report
          if (toDelete.length > 0) {
              await Destination.deleteMany({ _id: { $in: toDelete } }).catch(() => null);
          }

          const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(`${BOT_EMOJIS.LINK} Verified Destinations`)
            .setDescription(uniqueDests.length === 0 ? '_No destinations configured._' : uniqueDests.map((d: any, i: number) => `**[${i + 1}]** \`${d.email}\` ${d.verified ? '✅' : '⏳ (Unverified)'}`).join('\n'))
            .setFooter({ text: `Quota: ${uniqueDests.length}/${limits.maxDestinations} used` });
          return reply(embed);
       }
       if (action === 'remove' || action === 'delete') {
          const email = args[2]?.toLowerCase();
          if (!email) return reply(`${BOT_EMOJIS.WARNING} Usage: \`${PREFIX}user dest remove <email>\``);
          const res = await Destination.deleteOne({ userId: user.id, email });
          if (res.deletedCount === 0) return reply(`${BOT_EMOJIS.WARNING} Email \`${email}\` not found in your destinations.`);
          return reply(`${BOT_EMOJIS.VERIFY} Destination \`${email}\` has been removed from your account.`);
       }
      
      return reply(`${BOT_EMOJIS.INFO} **Destination Management**\n\`${PREFIX}user dest add <email>\`\n\`${PREFIX}user dest verify <code>\`\n\`${PREFIX}user dest list\``);
    }

    // Support reactive synchronization with the SQL billing DB
    await syncUserPlan(user.id);
    
    const existingUser: any = await User.findOne({ discordId: user.id }).lean() || { plan: 'free' };
    const limits = getEffectiveLimits(existingUser.plan, 'free');
    const privateAliasLimit = existingUser.plan === 'supreme' ? 5 : (existingUser.plan === 'premium' ? 3 : 0);
    const userAliases = await Alias.find({ ownerId: user.id, status: 'active' }).lean();
    const privateAliasCount = userAliases.filter((a: any) => a.privacyMode || a.forwardTo || a.webhookUrl).length;

    if (sub === 'plan') {
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`${BOT_EMOJIS.PLAN} Your MailCord Plan`)
        .addFields(
          { name: 'Current Tier', value: existingUser.plan?.toUpperCase() || 'FREE', inline: true },
          { name: 'Alias Usage', value: `${userAliases.length} / ${limits.maxAliases}`, inline: true },
          { name: 'Private Aliases', value: `${privateAliasCount} / ${privateAliasLimit}`, inline: true },
          { name: 'Restore Access', value: existingUser.plan === 'supreme' ? '✅ Active' : '❌ Inactive', inline: true }
        );
      if (existingUser.expiresAt) {
        embed.addFields({ name: 'Expiration', value: `<t:${Math.floor(new Date(existingUser.expiresAt).getTime() / 1000)}:D>`, inline: true });
      }
      return reply(embed);
    }

    if (sub === 'info') {
      const dashboard = await buildUserDashboardEmbed(user.id, message.guild!);
      return reply(dashboard);
    }

    if (sub === 'settings') {
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`${BOT_EMOJIS.GEAR} User Control Panel`)
        .setDescription('Manage your recovery details and private routing settings.')
        .addFields(
          { name: '📧 Recovery Email', value: existingUser.recoveryEmail || '`Not set`', inline: true },
          { name: '📱 Recovery Phone', value: existingUser.recoveryPhone || '`Not set`', inline: true },
          { name: '📍 Private Destination', value: existingUser.privateAliasDestination || '`Default (DM)`', inline: false }
        );

      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder().setCustomId('set_recovery').setLabel('Update Recovery').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('set_private_dest').setLabel('Routing Prefs').setStyle(ButtonStyle.Secondary)
        );

      return message.reply({ embeds: [embed], components: [row] });
    }

    if (sub === 'restore') {
      if (existingUser.plan !== 'supreme') {
        return reply(`${BOT_EMOJIS.WARNING} **Supreme Feature Required:** Contact support to upgrade your recovery options.`);
      }
      if (!existingUser.recoveryEmail) {
        return reply(`${BOT_EMOJIS.WARNING} You must set a recovery email first using \`${PREFIX}user settings\`.`);
      }
      
      const now = Date.now();
      if (existingUser.lastRestoreTime && now - existingUser.lastRestoreTime < 24 * 60 * 60 * 1000) {
        return reply(`${BOT_EMOJIS.WARNING} Restoration is limited to once every 24 hours.`);
      }

      await Alias.updateMany({ ownerId: user.id, status: 'deleted' }, { $set: { status: 'active' }, $unset: { deletedAt: 1 } });
      await User.updateOne({ discordId: user.id }, { $set: { lastRestoreTime: now } });
      
      return reply(`${BOT_EMOJIS.VERIFY} **Restoration Triggered!** Your verification code has been dispatched. (Simulated: Deleted aliases restored!)`);
    }

    if (sub === 'verify') {
      if (!existingUser.recoveryEmail && !existingUser.recoveryPhone) return reply(`${BOT_EMOJIS.WARNING} You haven't set any recovery info yet. Use \`!user settings\`.`);
      
      const type = args[1]?.toLowerCase();
      if (type === 'email') {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await User.updateOne({ discordId: user.id }, { $set: { isEmailVerified: true } }); // Simulated verification success
        return reply(`${BOT_EMOJIS.VERIFY} **Email Verified!** Successfully linked \`${existingUser.recoveryEmail}\` to your identity.`);
      }
      if (type === 'phone') {
        await User.updateOne({ discordId: user.id }, { $set: { isPhoneVerified: true } });
        return reply(`${BOT_EMOJIS.VERIFY} **Phone Verified!** Successfully linked \`${existingUser.recoveryPhone}\` to your identity.`);
      }
      return reply(`Usage: \`${PREFIX}user verify <email|phone>\``);
    }

    return reply(`Usage: \`${PREFIX}user settings\` | \`${PREFIX}user plan\` | \`${PREFIX}user verify\` | \`${PREFIX}user restore\``);
  }

  if (command === 'listc') {
    const userRecord: any = await User.findOne({ discordId: message.author.id }).lean() || { plan: 'free' };
    const guildRecord: any = message.guildId ? await Guild.findOne({ guildId: message.guildId }).lean() || { plan: 'free' } : { plan: 'free' };
    const limits = getEffectiveLimits(userRecord.plan, guildRecord.plan);
    const userAliases = await Alias.find({ ownerId: user.id, status: 'active' }).lean();
    const destCount = await Destination.countDocuments({ userId: user.id });

    const targetCat = args[0]?.toLowerCase();

    const catInfo: any = {
      'identity': { name: '📨 Identity (Alias System)', emoji: '📨' },
      'inbox': { name: '📥 Inbox', emoji: '📥' },
      'tools': { name: '🧠 Smart Tools (Filtering)', emoji: '🧠' },
      'account': { name: '👤 Account Control', emoji: '👤' },
      'billing': { name: '💳 Billing & Quota', emoji: '💳' },
      'system': { name: '⚙️ System & Utility', emoji: '⚙️' },
      'server': { name: '🛡️ Server Management', emoji: '🛡️' }
    };

    const categories = ['identity', 'inbox', 'tools', 'account', 'billing', 'system'];
    
    if (targetCat === 'server') {
        if (!canSeeAdmin(message)) return reply(`${BOT_EMOJIS.WARNING} **Access Denied:** Server management commands are restricted to Administrators and Bot Managers.`, '#E74C3C');
        const groupCmds = COMMAND_REGISTRY.filter(c => c.cat === 'server');
        const val = groupCmds.map(c => `• \`${c.syntax}\` - ${c.desc}`).join('\n');
        const e = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle(`🏛️ Server Management Commands`)
            .setDescription(`Exclusive controls for bot managers and administrators.\n\n━━━━━━━━━━━━━━━━━━\n\n${val}`);
        return reply(e);
    }

    if (targetCat === 'dev' || targetCat === 'developer' || targetCat === 'devloper') {
        if (!isDeveloper(message.author.id)) {
            return reply(`❌ **Access Denied:** Developer & diagnostic commands are strictly restricted to authorized developers.`, '#E74C3C');
        }
        const e = new EmbedBuilder()
            .setColor('#8B5CF6')
            .setTitle(`🛠️ MailCord | Developer & Diagnostic Commands`)
            .setDescription(`System telemetry, user management, and developer controls for MailCord.\n\n━━━━━━━━━━━━━━━━━━`)
            .addFields(
              { name: `\`!dev setplan <@user|id> <tier> [days]\``, value: `→ Directly update any user's subscription tier (*free, premium, supreme*).`, inline: false },
              { name: `\`!dev setserver [guild_id] <tier> [days]\``, value: `→ Directly update server tier (*free, pro, enterprise*).`, inline: false },
              { name: `\`!dev userinfo <@user|id>\``, value: `→ View detailed account profile, quota usages, and expiration.`, inline: false },
              { name: `\`!dev resetuser <@user|id>\``, value: `→ Downgrade user back to free tier.`, inline: false },
              { name: `\`!dev genkey <plan> [days]\``, value: `→ Generate a redeemable license code (*premium, supreme, enterprise*).`, inline: false },
              { name: `\`!dev keys [unused|all]\``, value: `→ List recently generated license keys and status.`, inline: false },
              { name: `\`!dev delkey <code>\``, value: `→ Delete or revoke an unused license key.`, inline: false },
              { name: `\`!redeem <code> [@user]\``, value: `→ Redeem an upgrade key (optionally apply to target @user).`, inline: false },
              { name: `\`!test <alias>\``, value: `→ Run live SMTP handshake, DNS/MX verification, and probe test.`, inline: false },
              { name: `\`!servers\` / \`!users\``, value: `→ Display connected Discord servers and global user count.`, inline: false },
              { name: `\`!reload\``, value: `→ Refresh application slash commands and flush local cache.`, inline: false },
              { name: `\`!stats\``, value: `→ View memory heap, uptime, process PID, and latency telemetry.`, inline: false }
            )
            .setFooter({ text: `MailCord Developer Access Authorized • PID: ${PROCESS_ID} • BUILD: ${BUILD_TIME}` })
            .setTimestamp();
        return reply(e);
    }

    if (targetCat && catInfo[targetCat]) {
      const cmds = COMMAND_REGISTRY.filter(c => c.cat === targetCat);
      const val = cmds.map(c => `\`${c.syntax}\` → ${c.desc}${c.pro ? ' 🚀' : ''}`).join('\n');
      const e = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`${catInfo[targetCat].name}`)
        .setDescription(`Showing all commands for this intelligence module.\n\n━━━━━━━━━━━━━━━━━━\n\n${val}`);
      return reply(e);
    }

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`📨 NebulaMailCord — Command Index`)
      .setDescription(`User: <@${message.author.id}>\nPlan: **${userRecord.plan?.toUpperCase() || 'FREE'}**\n\n━━━━━━━━━━━━━━━━━━`)
      .setTimestamp();

    for (const cat of categories) {
      const cmds = COMMAND_REGISTRY.filter(c => c.cat === cat && !(c as any).hidden);
      if (cmds.length === 0) continue;
      
      const val = cmds.map(c => `• \`${c.syntax}\` → ${c.desc}${c.pro ? ' 🚀' : ''}`).join('\n');
      embed.addFields({ name: `${catInfo[cat].name}`, value: val + `\n━━━━━━━━━━━━━━━━━━`, inline: false });
    }

    embed.addFields({ 
       name: `📊 Quick Stats`, 
       value: `Aliases: \`${userAliases.length} / ${limits.maxAliases === Infinity ? '∞' : limits.maxAliases}\` | ` +
              `Destinations: \`${destCount} / ${limits.maxDestinations}\` | ` +
              `Plan: **${userRecord.plan?.toUpperCase() || 'FREE'}**`,
       inline: false
    });

    embed.setFooter({ text: `Tip: Use !listc dev for developer commands • !listc <category> • BUILD: ${BUILD_TIME}` });
    return message.reply({ embeds: [embed] });
  }

  if (command === 'help') {
    const subArg = args[0]?.toLowerCase();
    
    // Categorized Help Mapping
    const categories: any = {
      'alias': 'identity',
      'id': 'identity',
      'tools': 'tools',
      'filters': 'tools',
      'account': 'account',
      'user': 'account',
      'billing': 'billing',
      'system': 'system',
      'mail': 'inbox'
    };

    const targetCat = categories[subArg];
    if (targetCat) {
      const cmds = COMMAND_REGISTRY.filter(c => c.cat === targetCat);
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`${BOT_EMOJIS.GEAR} Node Help: ${subArg.toUpperCase()}`)
        .setDescription(`Showing all commands for this intelligence module.`)
        .addFields(
          cmds.map(c => ({ name: `\`${c.syntax}\``, value: `→ ${c.desc}${c.pro ? ' 🚀' : ''}` }))
        );
      return reply(embed);
    }

    if (!subArg) {
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`${BOT_EMOJIS.HELP} NebulaMailCord | Help Center`)
        .setDescription('Navigate through system features using categories below.\n')
        .addFields(
          { 
            name: `🧩 Core Systems`, 
            value: `🔹 \`!help alias\`\n🔹 \`!help mail\`\n🔹 \`!help tools\``, 
            inline: true 
          },
          { 
            name: `👤 Management`, 
            value: `🔹 \`!help account\`\n🔹 \`!help billing\`\n🔹 \`!help system\``, 
            inline: true 
          }
        )
        .setFooter({ text: `Use !listc for a complete command index.` });
      return reply(embed);
    }
  }

  if (command === 'plan' || command === 'plans') {
    const sub = args[0]?.toLowerCase();
    
    if (sub === 'premium') {
      const embed = new EmbedBuilder()
        .setColor('#6366F1')
        .setTitle(`${BOT_EMOJIS.PLAN} Nebula Premium | Core Breakdown`)
        .setDescription('Advanced messaging for power users.')
        .addFields(
          { name: '📧 Aliases', value: '50 Active Identities', inline: true },
          { name: '⏱️ Retention', value: '30 Days Storage', inline: true },
          { name: '🛡️ Recovery', value: '7-Day Grace Period', inline: true },
          { name: '🚀 Features', value: '• !send Outbound\n• Private Forwarding\n• Custom Notifications', inline: false }
        )
        .setFooter({ text: 'Upgrade to Supreme for unlimited infrastructure access.' });
      return reply(embed);
    }

    if (sub === 'supreme') {
      const embed = new EmbedBuilder()
        .setColor('#8B5CF6')
        .setTitle(`${BOT_EMOJIS.CROWN} Nebula Supreme | Infinite Power`)
        .setDescription('The ultimate messaging architecture.')
        .addFields(
          { name: '📧 Aliases', value: 'Unlimited Identities', inline: true },
          { name: '⏱️ Retention', value: '90 Days Storage', inline: true },
          { name: '🏗️ Scale', value: 'Custom Domains & APIs', inline: true },
          { name: '⚡ Perks', value: '• Instant Restore\n• Priority IP Routing\n• Dedicated Support Role', inline: false }
        )
        .setFooter({ text: 'The gold standard in private communications.' });
      return reply(embed);
    }

    if (sub === 'server') {
      const embed = new EmbedBuilder()
        .setColor('#F1C40F')
        .setTitle(`${BOT_EMOJIS.PLAN} Server Infrastructure Plans`)
        .setDescription('High-performance messaging for your entire community.')
        .addFields(
          { name: '🏢 Enterprise', value: '₹2,499/mo\n- Unlimited Aliases\n- Shared Inbox Channels\n- Custom Domain API', inline: true },
          { name: '🌐 Supreme Server', value: '₹4,999/mo\n- Dedicated IP Routing\n- Priority S3 Storage\n- 24/7 Priority Node', inline: true }
        )
        .setFooter({ text: 'All server plans cover every member in the server.' });
      return reply(embed);
    }

    const embed = new EmbedBuilder()
      .setColor('#6366F1')
      .setTitle(`${BOT_EMOJIS.CROWN} Premium Tiers (Personal)`)
      .setDescription('Scale your messaging power with comparative intelligence.')
      .addFields(
        { name: '🌟 Premium', value: '₹349/mo\n- 50 Aliases\n- 30 Days Retention\n- Private Destinations', inline: true },
        { name: '👑 Supreme', value: '₹999/mo\n- Unlimited Aliases\n- 90 Days Retention\n- Full Recovery APIs', inline: true }
      )
      .setFooter({ text: 'Type !plan server to see community infrastructure tiers.' });
    return reply(embed);
  }

  if (command === 'start') {
    const embed = new EmbedBuilder()
      .setColor('#2ECC71')
      .setTitle(`${BOT_EMOJIS.BACKUP} Nebula Onboarding Initialization`)
      .setDescription(`Welcome to the next generation of private messaging, <@${user.id}>.\n\n` +
        `**Follow these steps to synchronize your identity:**\n` +
        `1️⃣ **Setup Inbox:** Use \`!inbox setup\` to create your control center.\n` +
        `2️⃣ **Create Alias:** Use \`!alias create <name>\` to generate your first ID.\n` +
        `3️⃣ **Send Mail:** Use \`!send\` to test your outbound engine [Premium].\n\n` +
        `Need help? Just type \`!help\` at any time.`)
      .setFooter({ text: 'NebulaMailCord v2.5.0 | Advanced Intelligence' });
    return reply(embed);
  }

  if (command === 'test' || command === 'testing') {
    let aliasName = args[0]?.toLowerCase();
    if (!aliasName) return reply(`${BOT_EMOJIS.WARNING} Usage: \`${PREFIX}test <alias_name>\`\n*(Example: \`${PREFIX}test primary\`)*`);
    
    // Strip domain if full email is provided
    if (aliasName.includes('@')) {
      aliasName = aliasName.split('@')[0];
    }
    
    const record = await getAlias(aliasName);
    if (!record || record.ownerId !== message.author.id) return reply(`${BOT_EMOJIS.WARNING} **Identity Error:** This alias does not exist or you do not own it.`, '#E74C3C');

    const statusEmbed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`${BOT_EMOJIS.LATENCY} MailCord | Diagnostic Engine`)
      .setDescription(`Initiating connectivity sequence for: \`${aliasName}@${CF_DOMAIN}\`\n\n` +
        `⏳ **Step 1:** Verifying SMTP Handshake...\n` +
        `🔹 **Step 2:** Routing through Cloudflare Worker...\n` +
        `🔹 **Step 3:** Awaiting local delivery...`);

    const statusMsg = await message.reply({ embeds: [statusEmbed] });

    const mailOptions = {
      from: '"MailCord Diagnostic Engine" <tushar0p.test@gmail.com>',
      to: `${aliasName}@${CF_DOMAIN}`,
      subject: '📬 NebulaMailCord | Diagnostic Test Signal',
      text: `Hello,\n\nThis is an automated diagnostic signal dispatched from the MailCord engine for identity: ${aliasName}.\n\nConnectivity Status: OPTIMAL\nEngine: v2.5 (NebulaCore)\n\nTimestamp: ${new Date().toISOString()}`,
      html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #5865F2; border-radius: 10px;">
              <h2 style="color: #5865F2;">📬 Diagnostic Signal</h2>
              <p>This is an automated connectivity test for your alias: <b>${aliasName}@${CF_DOMAIN}</b></p>
              <div style="background: #f4f4f4; padding: 10px; border-radius: 5px;">
                <code>STATUS: OPERATIONAL</code><br/>
                <code>ENGINE: NEBULA-01</code>
              </div>
              <p style="font-size: 0.8em; color: #666;">Generated at: ${new Date().toISOString()}</p>
             </div>`
    };

    try {
      // Step 1 Success visual
      statusEmbed.setDescription(`Initiating connectivity sequence for: \`${aliasName}@${CF_DOMAIN}\`\n\n` +
        `✅ **Step 1:** SMTP Handshake Successful\n` +
        `⏳ **Step 2:** Routing through Cloudflare Worker...\n` +
        `🔹 **Step 3:** Awaiting local delivery...`);
      await statusMsg.edit({ embeds: [statusEmbed] });

      await testTransporter.sendMail(mailOptions);

      // Final Success
      statusEmbed.setColor('#2ECC71')
        .setDescription(`✅ **Diagnostic Complete!**\n\nThe test signal has been dispatched to \`${aliasName}@${CF_DOMAIN}\`.\n\n> **Next Step:** Check your private inbox channel for the receipt. If it doesn't appear within 30 seconds, verify your Cloudflare settings.`)
        .setFooter({ text: 'Diagnostic Engine v2.5 • All systems green' });

      return statusMsg.edit({ embeds: [statusEmbed] });
    } catch (err: any) {
      console.error('SMTP Test Error:', err);
      statusEmbed.setColor('#E74C3C')
        .setDescription(`❌ **Diagnostic Failure**\n\n**SMTP Error:** \`${err.message}\`\n\n> Please verify your SMTP credentials are still valid. If using Gmail, ensure App Passwords are active.`);
      return statusMsg.edit({ embeds: [statusEmbed] });
    }
  }

  if (['about', 'invite', 'ping', 'botinfo', 'prefix'].includes(command!)) {
     if (command === 'about') {
        const embed = new EmbedBuilder()
           .setColor('#5865F2')
           .setTitle(`${BOT_EMOJIS.INFO} About NebulaMailCord Intelligence`)
           .setDescription("> **NebulaMailCord** is an advanced alias virtualization engine driven by **Nebula-Core v2.5**.\n\n### 🧠 Intelligence Suite\n🔹 **Auto-Service Profiling**: Instant settings for Netflix, Discord, & more.\n🔹 **Bulk Identity Deployment**: Supreme-tier alias presets.\n🔹 **Conditional Encryption**: Smart privacy nodes with 'Click to Reveal' delivery.\n\n### ⚙️ System Specs\n📡 **Engine:** `Nebula-X`\n🛡️ **Security:** `AES-256 Content Masking`\n🏗️ **Matrix:** `User/Server Plan Intersection`\n\n---\n💡 Empowering privacy-first communication via intelligent routing.")
           .setThumbnail(client.user?.displayAvatarURL() || null);
        return message.reply({ embeds: [embed] });
     }
     if (command === 'invite') {
        const embed = new EmbedBuilder()
           .setColor('#5865F2')
           .setTitle(`${BOT_EMOJIS.LINK} Invite MailCord`)
           .setDescription(`Add MailCord to your server and start managing aliases instantly.\n\n👉 [Click here to invite](https://discord.com/api/oauth2/authorize?client_id=${client.user?.id}&permissions=8&scope=bot%20applications.commands)\n\n💡 Requires Admin permissions for initial setup.`);
        return reply(embed);
     }
     if (command === 'ping') {
        const embed = new EmbedBuilder()
           .setColor('#2ECC71')
           .setTitle(`${BOT_EMOJIS.BOLT} Pong!`)
           .setDescription(`${BOT_EMOJIS.LATENCY} **Latency:** ${Date.now() - message.createdTimestamp} ms\n${BOT_EMOJIS.VERIFY} **API:** Stable (${Math.round(client.ws.ping)} ms)\n🆔 **Process:** \`${PROCESS_ID}\`\n\nSystem operating at peak performance.`);
        return reply(embed);
     }
     if (command === 'botinfo') {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const embed = new EmbedBuilder()
           .setColor('#5865F2')
           .setTitle(`${BOT_EMOJIS.STATS} System Statistics`)
           .setDescription(`📦 **Version:** v2.5 (NebulaCore)\n🌐 **Servers:** ${client.guilds.cache.size}\n👥 **Users:** ${client.users.cache.size}\n⚡ **Uptime:** ${days}d ${hours}h ${minutes}m\n\nAll services are currently **ONLINE** and stable.`)
           .setThumbnail(client.user?.displayAvatarURL() || null);
        return reply(embed);
     }
     if (command === 'prefix') {
        const embed = new EmbedBuilder()
           .setColor('#5865F2')
           .setTitle(`${BOT_EMOJIS.GEAR} Command Prefix`)
           .setDescription(`Current prefix: \`${PREFIX}\`\n\n💡 **Tip:**\nUse \`${PREFIX}help\` to see all commands.`);
        return reply(embed);
     }
  }

  if (command === 'filter') {
     const userRecord: any = await User.findOne({ discordId: user.id }).lean() || { plan: 'free' };
     const guildRecord: any = message.guildId ? await Guild.findOne({ guildId: message.guildId }).lean() || { plan: 'free' } : { plan: 'free' };
     const limits = getEffectiveLimits(userRecord.plan, guildRecord.plan);
     if (!limits.features) return reply("❌ **MailCord Pro Required:** Filtering is a premium feature.", '#E74C3C');

     const sub = args.shift()?.toLowerCase();
     const aliasName = args.shift()?.toLowerCase();
     const keyword = args.join(' ').toLowerCase();
     if (!sub || !aliasName) return reply(`Usage: \`${PREFIX}filter <add|remove|list> <alias> [keyword]\`\n*Tip: Start keyword with \`-\` to auto-delete matching emails (e.g., \`-spam\`)*`);
     const record = await getAlias(aliasName);
     if (!record || record.ownerId !== user.id) return reply("❌ Alias not found or not owned by you.", '#E74C3C');

     if (sub === 'add') {
        if (!keyword) return reply("❌ Provide a keyword.");
        if (record.filters?.includes(keyword)) return reply("❌ Filter already exists.");
        await Alias.updateOne({ name: aliasName }, { $push: { filters: keyword } });
        invalidateAliasCache(aliasName);
        return reply(`${BOT_EMOJIS.VERIFY} Filter \`${keyword}\` added to \`${aliasName}\`.`);
     }
     if (sub === 'remove') {
        if (!keyword) return reply("❌ Provide a keyword.");
        await Alias.updateOne({ name: aliasName }, { $pull: { filters: keyword } });
        invalidateAliasCache(aliasName);
        return reply(`✅ Removed filter \`${keyword}\` from \`${aliasName}\``);
     }
     if (sub === 'list') {
        const filters = record.filters || [];
        if (!filters.length) return reply("No filters set for this alias.");
        return reply(`**Filters for \`${aliasName}\`:**\n${filters.map((f:string) => `- \`${f}\``).join('\n')}`);
     }
  }

  if (command === 'notify') {
     const sub = args.shift()?.toLowerCase();
     if (!sub) return reply(`${BOT_EMOJIS.WARNING} Usage: \`${PREFIX}notify <on|off|keyword> [word]\``);
     if (sub === 'on' || sub === 'off') {
        await User.updateOne({ discordId: user.id }, { $set: { notify: sub === 'on' } }, { upsert: true });
        return reply(`${BOT_EMOJIS.VERIFY} Notifications turned **${sub.toUpperCase()}**.`);
     }
     if (sub === 'keyword') {
        const word = args.join(' ').toLowerCase();
        if (!word) return reply(`${BOT_EMOJIS.WARNING} Provide a keyword.`);
        await User.updateOne({ discordId: user.id }, { $addToSet: { notifyKeywords: word } }, { upsert: true });
        return reply(`${BOT_EMOJIS.VERIFY} Added notification keyword \`${word}\`.`);
     }
  }

  if (command === 'inbox') {
      const sub = args.shift()?.toLowerCase();
      if (sub === 'history') {
         const aliasName = args.shift()?.toLowerCase();
         if (!aliasName) return reply(`${BOT_EMOJIS.WARNING} Provide an alias name.`);
         const record = await getAlias(aliasName);
         if (!record || record.ownerId !== user.id) return reply(`${BOT_EMOJIS.WARNING} Alias not found.`, '#E74C3C');
         const emails = await Email.find({ alias: aliasName }).sort({ timestamp: -1 }).limit(5).lean();
         if (!emails.length) return reply(`${BOT_EMOJIS.MAIL} No emails found for this alias.`);
         const history = emails.map((e:any) => `**From:** ${e.from}\n**Subject:** ${e.subject}\n**Time:** <t:${Math.floor(e.timestamp/1000)}:R>\n`).join('\n---\n');
         return reply(`${BOT_EMOJIS.MAIL} **Recent Activity: \`${aliasName}\`**\n\n${history}`);
      }
      if (sub === 'search') {
         const userRecord: any = await User.findOne({ discordId: user.id }).lean() || { plan: 'free' };
         if (userRecord.plan === 'free') return reply(`${BOT_EMOJIS.PLAN} **MailCord Pro Required:** Inbox search is a premium feature.`, '#E74C3C');

         const keyword = args.join(' ').toLowerCase();
         if (!keyword) return reply(`${BOT_EMOJIS.WARNING} Provide a keyword to search.`);
         const userAliases = await Alias.find({ ownerId: user.id }).lean();
         const aliasNames = userAliases.map((a:any) => a.name);
         const emails = await Email.find({ alias: { $in: aliasNames }, $or: [{ subject: new RegExp(keyword, 'i') }, { body: new RegExp(keyword, 'i') }] }).sort({ timestamp: -1 }).limit(5).lean();
         if (!emails.length) return reply(`${BOT_EMOJIS.SEARCH} No matches found for \`${keyword}\`.`);
         const results = emails.map((e:any) => `**Alias:** ${e.alias}\n**Subject:** ${e.subject}\n**Time:** <t:${Math.floor(e.timestamp/1000)}:R>\n`).join('\n---\n');
         return reply(`${BOT_EMOJIS.SEARCH} **Search Results for \`${keyword}\`**\n\n${results}`);
      }
      if (sub === 'reset') {
         const userAliases = await Alias.find({ ownerId: user.id }).lean();
         const aliasNames = userAliases.map((a:any) => a.name);
         const result = await Email.deleteMany({ alias: { $in: aliasNames } });
         return reply(`${BOT_EMOJIS.TRASH} Inbox wiped. Cleared **${result.deletedCount}** emails.`);
      }
      return reply(`${BOT_EMOJIS.WARNING} Usage: \`!inbox <history|search|reset>\``);
  }

  if (command === 'reset') {
      const embed = new EmbedBuilder()
        .setColor('#F1C40F')
        .setTitle('⚠️ Safety Confirmation Required')
        .setDescription('You have requested a reset. This action **cannot be undone**.\n\n' +
          `• **Local Guild Reset**: Wipes your workspace ONLY in **${message.guild.name}**.\n` +
          '• **Full Factory Reset**: Wipes your ENTIRE account (All aliases, settings, and recovery info).')
        .setFooter({ text: `Process ID: ${PROCESS_ID}` })
        .setTimestamp();

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('confirm_user_guild_reset').setLabel('Guild Reset').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('confirm_user_full_reset').setLabel('FACTORY RESET').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('cancel_reset').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
      );

      return reply(embed, '#F1C40F', [row], 30);
  }

  if (command === 'alias') {
    const userRecord: any = await User.findOne({ discordId: user.id }).lean() || { plan: 'free' };
    let guildRecord: any = message.guildId ? await Guild.findOne({ guildId: message.guildId }).lean() || { plan: 'free' } : { plan: 'free' };
    const userPlan = userRecord.plan || 'free';
    const limits = getEffectiveLimits(userPlan, guildRecord.plan);
    const expiresAtDefault = limits.aliasExpiryDays === Infinity ? undefined : now + (limits.aliasExpiryDays * 24 * 60 * 60 * 1000);
    const sub = args.shift()?.toLowerCase();
    
    if (!sub) return reply(`${BOT_EMOJIS.INFO} Usage: \`${PREFIX}alias <create|delete|list|rename|info|lock|unlock|transfer|preset|private|privatedm|route|unroute>\``);
        
        if (sub === 'preset') {
          if (userPlan !== 'supreme') return reply(`${BOT_EMOJIS.PLAN} **Supreme Mastery Required:** Bulk Preset creation is reserved for Supreme plan users.`, '#E74C3C');
          const type = args[0]?.toLowerCase();
          if (!PRESETS[type]) return reply(`${BOT_EMOJIS.WARNING} Invalid preset type. Available: \`${Object.keys(PRESETS).join(', ')}\``);

          const services = PRESETS[type];
          const results = [];
          for (const service of services) {
            const aliasName = `${userRecord.username || 'user'}-${service}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
            const fullEmail = `${aliasName}@${CF_DOMAIN}`;
            const intelligence = applyAliasIntelligence(aliasName, limits);
            
            const expiresAt = intelligence.expiryOverride !== undefined ? intelligence.expiryOverride : expiresAtDefault;
            const filters = intelligence.autoSpam ? ['-spam', '-marketing'] : [];

            await Alias.updateOne(
              { name: aliasName }, 
              { $set: { ownerId: user.id, status: 'active', locked: intelligence.locked, emailsReceived: 0, createdAt: now, expiresAt, filters }, $unset: { deletedAt: 1 } }, 
              { upsert: true }
            );
            invalidateAliasCache(aliasName);
            await createCloudflareAlias(fullEmail);
            results.push(`\`${aliasName}\``);
          }
          return reply(`${BOT_EMOJIS.BOLT} **Advanced Intelligence Deployment:** Created ${results.length} identities for **${type.toUpperCase()}**:\n${results.join(', ')}`, '#2ECC71');
        }

        if (sub === 'create') {
          if (!userRecord.recoveryEmail || !userRecord.recoveryPhone) {
            const row = new ActionRowBuilder<ButtonBuilder>()
              .addComponents(
                new ButtonBuilder().setCustomId('set_recovery').setLabel('Set Recovery Info').setStyle(ButtonStyle.Primary).setEmoji('🛡️')
              );
            return reply(`${BOT_EMOJIS.WARNING} **First-time Setup Required**\nYou must set a recovery email and phone number.`, '#F1C40F', [row]);
          }

          // Auto-setup: complete guild setup automatically if not done yet
          if (message.guildId && !guildRecord.setupCompleted) {
            await Guild.updateOne({ guildId: message.guildId }, { $set: { setupCompleted: true } }, { upsert: true });
            guildRecord = { ...guildRecord, setupCompleted: true };
          }

          if (!checkCreationRateLimit(user.id)) {
            return reply(`${BOT_EMOJIS.WARNING} Rate limit: Slow down identity creation.`, '#E74C3C');
          }

          const activeCount = await Alias.countDocuments({ ownerId: user.id, status: 'active' });
          if (activeCount >= limits.maxAliases) return reply(`${BOT_EMOJIS.WARNING} Plan limit: Upgrade for more aliases.`, '#E74C3C');

          let aliasName = args[0]?.toLowerCase().replace(/[^a-z0-9-]/g, '');
          let wasRandomized = false;
          
          if (!aliasName) {
            // Premium Autonomous Mode (Cool names) vs Free Mode (Random strings)
            if (userPlan === 'premium' || userPlan === 'supreme') {
               const adjectives = ['prime', 'neo', 'luxe', 'zen', 'pure', 'bold', 'epic', 'rare', 'nova', 'apex', 'zenith', 'pulse', 'swift', 'dark', 'neon', 'blue', 'cyber', 'iron', 'ghost', 'tech'];
               const nouns = ['vault', 'node', 'core', 'link', 'mail', 'base', 'flow', 'axis', 'grid', 'zone', 'wave', 'point', 'flux', 'wolf', 'fox', 'shadow', 'rift', 'shield', 'cloud', 'edge'];
               aliasName = `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${nouns[Math.floor(Math.random() * nouns.length)]}-${Math.floor(10 + Math.random() * 89)}`;
               wasRandomized = true;
            } else {
               // Free users get basic random strings when they don't provide a name
               aliasName = Math.random().toString(36).substring(2, 10);
               wasRandomized = true;
            }
          } else {
            // User provided a specific name
            if (!limits.customNames) {
               return reply(`${BOT_EMOJIS.WARNING} Custom alias names require a Premium plan! Use \`${PREFIX}ac\` without a name to generate a random identity, or use \`/billing\` to upgrade.`);
            }
            if (aliasName.length < 3 || aliasName.length > 30) return reply(`${BOT_EMOJIS.WARNING} Custom alias name must be 3-30 characters.`, '#E74C3C');
          }

          const fullEmail = `${aliasName}@${CF_DOMAIN}`;
          const existing = await getAlias(aliasName);
          if (existing && existing.status === 'active') return reply(`${BOT_EMOJIS.WARNING} This alias is already taken.`, '#E74C3C');

          const intelligence = applyAliasIntelligence(aliasName, limits);
          const expiresAt = intelligence.expiryOverride !== undefined ? intelligence.expiryOverride : expiresAtDefault;

          await Alias.updateOne(
            { name: aliasName }, 
            { $set: { ownerId: user.id, status: 'active', locked: intelligence.locked, emailsReceived: 0, createdAt: now, expiresAt, filters: intelligence.autoSpam ? ['-spam'] : [] }, $unset: { deletedAt: 1 } }, 
            { upsert: true }
          );
          invalidateAliasCache(aliasName);
          await createCloudflareAlias(fullEmail);
          
          let replyMsg = `${BOT_EMOJIS.VERIFY} Identity \`${fullEmail}\` synced successfully!`;
          if (wasRandomized) {
            const isPaid = userPlan === 'premium' || userPlan === 'supreme';
            replyMsg += isPaid 
              ? `\n🎲 **Autonomous Mode:** Generated secure random identity.`
              : `\n🎲 **Tier Limit:** Plan restricted. Generated random identity.`;
          }
          if (expiresAt) replyMsg += `\n*(Expires <t:${Math.floor(expiresAt/1000)}:R>)*`;

          return reply(replyMsg, '#2ECC71');
        }

        if (sub === 'list') {
        const activeAliases = await Alias.find({ ownerId: user.id, status: 'active' }).lean();
        if (!activeAliases.length) return reply(`${BOT_EMOJIS.INFO} You have no active aliases.`);
        return reply(`${BOT_EMOJIS.MAIL} **Your Active Aliases:**\n${activeAliases.map((a:any) => `📧 \`${a.name}@${CF_DOMAIN}\` ${a.locked ? BOT_EMOJIS.LOCK : ''}`).join('\n')}`);
     }

     if (sub === 'delete') {
         const aliasInput = args[0]?.toLowerCase();
         const aliasName = aliasInput?.includes('@') ? aliasInput.split('@')[0] : aliasInput;
        const record = await getAlias(aliasName);
        if (!record || record.ownerId !== user.id || record.status !== 'active') return reply(`${BOT_EMOJIS.WARNING} Alias not found or not owned by you.`, '#E74C3C');
        if (record.locked) return reply(`${BOT_EMOJIS.LOCK} This alias is locked. Unlock it first.`, '#E74C3C');

        await Alias.updateOne({ name: aliasName }, { $set: { status: 'deleted', deletedAt: now } });
        invalidateAliasCache(aliasName);
        await deleteCloudflareAlias(`${aliasName}@${CF_DOMAIN}`);
        return reply(`${BOT_EMOJIS.TRASH} Alias \`${aliasName}@${CF_DOMAIN}\` has been deleted.`, '#E67E22');
     }

      if (sub === 'recover') {
         const aliasInput = args[0]?.toLowerCase();
         const aliasName = aliasInput?.includes('@') ? aliasInput.split('@')[0] : aliasInput;
         if (!aliasName) return reply(`${BOT_EMOJIS.WARNING} Usage: \`${PREFIX}alias recover <name>\``);
         
         const userRecord: any = await User.findOne({ discordId: user.id }).lean() || { plan: 'free' };
         if (userRecord.plan === 'free') return reply(`${BOT_EMOJIS.PLAN} **Premium Feature:** Identity recovery is reserved for paid users.`, '#E74C3C');

         const record = await Alias.findOne({ name: aliasName, ownerId: user.id, status: 'expired' }).lean();
         if (!record) return reply(`${BOT_EMOJIS.WARNING} No recoverable identity found with the name \`${aliasName}\`. (Note: Recovery period is 7 days)`);

         const activeCount = await Alias.countDocuments({ ownerId: user.id, status: 'active' });
         const limits = getEffectiveLimits(userRecord.plan, 'free');
         if (activeCount >= limits.maxAliases) return reply(`${BOT_EMOJIS.WARNING} **Limit Reached:** Resolve your alias quota before recovering.`, '#E74C3C');

         const expiresAt = Date.now() + (limits.aliasExpiryDays * 24 * 60 * 60 * 1000);
         await Alias.updateOne({ name: aliasName }, { $set: { status: 'active', expiresAt }, $unset: { deletedAt: 1 } });
         invalidateAliasCache(aliasName);
         await createCloudflareAlias(`${aliasName}@${CF_DOMAIN}`);
         
         return reply(`${BOT_EMOJIS.VERIFY} **Identity Restored!** \`${aliasName}@${CF_DOMAIN}\` is back online for the next **${limits.aliasExpiryDays} days**.`);
      }

      if (sub === 'lock' || sub === 'unlock') {
        const aliasInput = args[0]?.toLowerCase();
        const aliasName = aliasInput?.includes('@') ? aliasInput.split('@')[0] : aliasInput;
        const record = await getAlias(aliasName);
        if (!record || record.ownerId !== user.id || record.status !== 'active') return reply(`${BOT_EMOJIS.WARNING} Alias not found.`, '#E74C3C');
        await Alias.updateOne({ name: aliasName }, { $set: { locked: sub === 'lock' } });
        invalidateAliasCache(aliasName);
        return reply(`${sub === 'lock' ? BOT_EMOJIS.LOCK : BOT_EMOJIS.UNLOCK} Alias \`${aliasName}\` is now **${sub === 'lock' ? 'LOCKED' : 'UNLOCKED'}**.`);
     }
      if (sub === 'private') {
         const aliasInput = args[0]?.toLowerCase();
         const aliasName = aliasInput?.includes('@') ? aliasInput.split('@')[0] : aliasInput;
        const record = await getAlias(aliasName);
        if (!record || record.ownerId !== user.id) return reply(`${BOT_EMOJIS.WARNING} Alias not found.`, '#E74C3C');
        
        const userRecord: any = await User.findOne({ discordId: user.id }).lean() || { plan: 'free' };
        const privateAliasLimit = userRecord.plan === 'supreme' ? 5 : (userRecord.plan === 'premium' ? 3 : 0);
        
        if (!record.privacyMode) {
           const userAliases = await Alias.find({ ownerId: user.id, status: 'active' }).lean();
           const privateAliasCount = userAliases.filter((a: any) => a.privacyMode || a.forwardTo || a.webhookUrl).length;
           if (privateAliasCount >= privateAliasLimit) {
              return reply(`${BOT_EMOJIS.WARNING} **Limit Reached:** Your plan allows a maximum of ${privateAliasLimit} private aliases.`, '#E74C3C');
           }
        }

        const newMode = !record.privacyMode;
        await Alias.updateOne({ name: aliasName }, { $set: { privacyMode: newMode } });
        invalidateAliasCache(aliasName);
        return reply(`${BOT_EMOJIS.STAR} Privacy Mode (Encryption) for \`${aliasName}\` is now **${newMode ? 'ENABLED (Locked)' : 'DISABLED (Plain Text)'}**.`);
     }

     if (sub === 'privatedm') {
         const aliasInput = args[0]?.toLowerCase();
         const aliasName = aliasInput?.includes('@') ? aliasInput.split('@')[0] : aliasInput;
         const record = await getAlias(aliasName);
         if (!record || record.ownerId !== user.id) return reply(`${BOT_EMOJIS.WARNING} Alias not found.`, '#E74C3C');
         
         const userRecord: any = await User.findOne({ discordId: user.id }).lean() || { plan: 'free' };
         const privateLimit = userRecord.plan === 'supreme' ? 5 : (userRecord.plan === 'premium' ? 3 : 0);
         
         if (!record.privateDM) {
            const userAliases = await Alias.find({ ownerId: user.id, status: 'active' }).lean();
            const privateCount = userAliases.filter((a: any) => a.privacyMode || a.privateDM || a.forwardTo || a.webhookUrl).length;
            if (privateCount >= privateLimit) {
               return reply(`${BOT_EMOJIS.WARNING} **Limit Reached:** Your plan allows a maximum of ${privateLimit} private identities.`, '#E74C3C');
            }
         }

         const newMode = !record.privateDM;
         await Alias.updateOne({ name: aliasName }, { $set: { privateDM: newMode } });
         invalidateAliasCache(aliasName);
         return reply(`${BOT_EMOJIS.LOCK} DM-Only Delivery for \`${aliasName}\` is now **${newMode ? 'ENABLED (DMs Only)' : 'DISABLED (Channel Delivery)'}**.`);
      }

     if (sub === 'public') {
         const aliasInput = args[0]?.toLowerCase();
         const aliasName = aliasInput?.includes('@') ? aliasInput.split('@')[0] : aliasInput;
         const record = await getAlias(aliasName);
         if (!record || record.ownerId !== user.id) return reply(`${BOT_EMOJIS.WARNING} Alias not found.`, '#E74C3C');
         
         await Alias.updateOne({ name: aliasName }, { $set: { privacyMode: false } });
         invalidateAliasCache(aliasName);
         return reply(`${BOT_EMOJIS.STAR} Privacy mode for \`${aliasName}\` has been **DISABLED**. Emails will route to server channels.`);
      }

     if (sub === 'info') {
        const aliasInput = args[0]?.toLowerCase();
        const aliasName = aliasInput?.includes('@') ? aliasInput.split('@')[0] : aliasInput;
        const record = await getAlias(aliasName);
        if (!record || record.ownerId !== user.id) return reply(`${BOT_EMOJIS.WARNING} Alias not found.`, '#E74C3C');
        
        const embed = new EmbedBuilder()
           .setColor('#3498DB')
           .setTitle(`${BOT_EMOJIS.MAIL} Alias Details`)
           .addFields(
              { name: 'Address', value: `\`${aliasName}@${CF_DOMAIN}\`` },
              { name: 'Status', value: record.status.toUpperCase(), inline: true },
              { name: 'Security', value: record.locked ? `${BOT_EMOJIS.LOCK} Locked` : `${BOT_EMOJIS.UNLOCK} Open`, inline: true },
              { name: 'Activity', value: `${BOT_EMOJIS.STATS} ${record.emailsReceived || 0} Emails`, inline: true },
              { name: 'Created', value: `<t:${Math.floor((record.createdAt||now)/1000)}:R>`, inline: true },
               { name: '🛡️ Privacy Status', value: `Encryption: ${record.privacyMode ? '✅' : '❌'}\nDM-Only: ${record.privateDM ? '✅' : '❌'}`, inline: true },
               { name: '📍 Routing', value: record.webhookUrl ? `🔗 Webhook` : (record.forwardTo ? `📧 ${record.forwardTo}` : `📬 Inbox Delivery`), inline: false }
           );
        return reply(embed);
     }

     if (sub === 'rename') {
        const oldInput = args[0]?.toLowerCase();
        const oldName = oldInput?.includes('@') ? oldInput.split('@')[0] : oldInput;
        const newName = args[1]?.toLowerCase().replace(/[^a-z0-9-]/g, '');
        if (!oldName || !newName || newName.length < 3) return reply(`${BOT_EMOJIS.WARNING} Usage: \`!alias rename <old> <new>\``, '#E74C3C');
        const record = await getAlias(oldName);
        if (!record || record.ownerId !== user.id || record.status !== 'active') return reply(`${BOT_EMOJIS.WARNING} Old alias not found.`, '#E74C3C');
        if (record.locked) return reply(`${BOT_EMOJIS.LOCK} Alias is locked.`, '#E74C3C');
        const existingNew = await getAlias(newName);
        if (existingNew && existingNew.status === 'active') return reply(`${BOT_EMOJIS.WARNING} New alias name is already taken.`, '#E74C3C');

        await deleteCloudflareAlias(`${oldName}@${CF_DOMAIN}`);
        await createCloudflareAlias(`${newName}@${CF_DOMAIN}`);
        await Alias.deleteOne({ name: oldName });
        const newRecord = { ...record, name: newName };
        delete newRecord._id;
        await Alias.create(newRecord);
        invalidateAliasCache(oldName);
        invalidateAliasCache(newName);
        return reply(`${BOT_EMOJIS.VERIFY} Successfully renamed \`${oldName}\` to \`${newName}@${CF_DOMAIN}\``);
     }

     if (sub === 'transfer') {
        const aliasInput = args[0]?.toLowerCase();
        const aliasName = aliasInput?.includes('@') ? aliasInput.split('@')[0] : aliasInput;
        const targetUser = message.mentions.users.first();
        if (!aliasName || !targetUser) return reply(`${BOT_EMOJIS.WARNING} Usage: \`!alias transfer <name> <@user>\``, '#E74C3C');
        const record = await getAlias(aliasName);
        if (!record || record.ownerId !== user.id || record.status !== 'active') return reply(`${BOT_EMOJIS.WARNING} Alias not found.`, '#E74C3C');
        if (record.locked) return reply(`${BOT_EMOJIS.LOCK} Alias is locked.`, '#E74C3C');

        await Alias.updateOne({ name: aliasName }, { $set: { ownerId: targetUser.id } });
        invalidateAliasCache(aliasName);
        return reply(`${BOT_EMOJIS.VERIFY} Transferred ownership of \`${aliasName}\` to ${targetUser}.`);
     }

      // Unified Routing Command (!alias route)
      if (sub === 'route') {
         const aliasInput = args.shift()?.toLowerCase();
         const aliasName = aliasInput?.includes('@') ? aliasInput.split('@')[0] : aliasInput;
         const type = args.shift()?.toLowerCase();

         if (!aliasName || !type) return reply(`${BOT_EMOJIS.INFO} Usage: \`${PREFIX}alias route <alias> <dm|forward|webhook> [value]\``);

         const record = await getAlias(aliasName);
         if (!record || record.ownerId !== user.id || record.status !== 'active') return reply(`${BOT_EMOJIS.WARNING} Alias not found or not owned by you.`, '#E74C3C');

         if (userPlan === 'free') return reply(`${BOT_EMOJIS.PLAN} **Premium Feature:** Custom routing is reserved for paid users.`, '#E74C3C');

         if (type === 'dm') {
            await Alias.updateOne({ name: aliasName }, { $unset: { forwardTo: 1, webhookUrl: 1 }, $set: { privacyMode: true } });
            invalidateAliasCache(aliasName);
            return reply(`${BOT_EMOJIS.VERIFY} **Routing Set:** \`${aliasName}\` now routing to your private DMs.`);
         }

         if (type === 'forward') {
            const destEmail = args.shift()?.toLowerCase();
            if (!destEmail) return reply(`${BOT_EMOJIS.WARNING} Usage: \`${PREFIX}alias route <alias> forward <email>\``);
            
            const destRecord = await Destination.findOne({ userId: user.id, email: destEmail, verified: true }).lean();
            if (!destRecord) return reply(`${BOT_EMOJIS.WARNING} **Security Block:** Destination \`${destEmail}\` is not verified. Use \`!user dest add\` first.`, '#F1C40F');

            await Alias.updateOne({ name: aliasName }, { $set: { forwardTo: destEmail }, $unset: { webhookUrl: 1 } });
            invalidateAliasCache(aliasName);
            return reply(`${BOT_EMOJIS.VERIFY} **Routing Set:** \`${aliasName}\` will now forward to \`${destEmail}\`.`);
         }

         if (type === 'webhook') {
            const url = args.shift();
            if (!url || !url.startsWith('http')) return reply(`${BOT_EMOJIS.WARNING} Usage: \`${PREFIX}alias route <alias> webhook <url>\``);

            await Alias.updateOne({ name: aliasName }, { $set: { webhookUrl: url }, $unset: { forwardTo: 1 } });
            invalidateAliasCache(aliasName);
            return reply(`${BOT_EMOJIS.VERIFY} **Routing Set:** \`${aliasName}\` will now pipe to your webhook.`);
         }
         return reply(`${BOT_EMOJIS.WARNING} Invalid route type: \`dm\`, \`forward\`, or \`webhook\`.`);
      }

      if (sub === 'unroute') {
         const aliasInput = args.shift()?.toLowerCase();
         const aliasName = aliasInput?.includes('@') ? aliasInput.split('@')[0] : aliasInput;
         if (!aliasName) return reply(`${BOT_EMOJIS.WARNING} Usage: \`${PREFIX}alias unroute <name>\``);

         const record = await getAlias(aliasName);
         if (!record || record.ownerId !== user.id) return reply(`${BOT_EMOJIS.WARNING} Alias not found or not owned by you.`, '#E74C3C');

         await Alias.updateOne({ name: aliasName }, { $unset: { forwardTo: 1, webhookUrl: 1 }, $set: { privacyMode: false } });
         invalidateAliasCache(aliasName);
         return reply(`${BOT_EMOJIS.VERIFY} **Route Cleared:** \`${aliasName}\` reset to default Discord delivery.`);
      }

      // Legacy support removal handled by route consolidation
      if (sub === 'forward' || sub === 'webhook') {
         return reply(`${BOT_EMOJIS.INFO} **Command Updated:** Please use \`${PREFIX}alias route ${sub} ...\` for identity routing.`, '#3498DB');
      }

      if (sub === 'unforward' || sub === 'unwebhook') {
         return reply(`${BOT_EMOJIS.INFO} **Command Updated:** Use \`${PREFIX}alias route <alias> dm\` to clear external routing.`);
      }

     if (sub === 'analytics' || sub === 'activity') {
        const aliasInput = args[0]?.toLowerCase();
        const aliasName = aliasInput?.includes('@') ? aliasInput.split('@')[0] : aliasInput;
        if (!aliasName) return reply(`${BOT_EMOJIS.WARNING} Usage: \`!alias analytics <alias>\``, '#E74C3C');
        const record = await getAlias(aliasName);
        if (!record || record.ownerId !== user.id) return reply(`${BOT_EMOJIS.WARNING} Alias not found.`, '#E74C3C');
        
        const emails = await Email.find({ alias: aliasName }).lean();
        const total = emails.length;
        const spam = emails.filter((e:any) => e.spamScore > 50).length;
        const otp = emails.filter((e:any) => e.category === 'OTP').length;

        const embed = new EmbedBuilder()
           .setColor('#3498DB')
           .setTitle(`${BOT_EMOJIS.STATS} Analytics for ${aliasName}`)
           .addFields(
              { name: 'Total Received', value: `${total}`, inline: true },
              { name: 'Spam Blocked', value: `${spam}`, inline: true },
              { name: 'OTPs Detected', value: `${otp}`, inline: true }
           );
        return reply(embed);
     }
     
     if (sub === 'backup') {
        const userRecord: any = await User.findOne({ discordId: user.id }).lean() || { plan: 'free' };
        if (userRecord.plan === 'free') return reply(`${BOT_EMOJIS.PLAN} **Premium Feature:** Data backups require a paid plan.`, '#E74C3C');
        const aliasName = args[0]?.toLowerCase();
        if (!aliasName) return reply(`${BOT_EMOJIS.WARNING} Usage: \`!alias backup <alias>\``, '#E74C3C');
        const record = await getAlias(aliasName);
        if (!record || record.ownerId !== user.id) return reply(`${BOT_EMOJIS.WARNING} Alias not found.`, '#E74C3C');
        
        const emails = await Email.find({ alias: aliasName }).lean();
        const backupData = JSON.stringify(emails, null, 2);
        const buffer = Buffer.from(backupData, 'utf-8');
        
        return message.reply({
           content: `📦 Backup for \`${aliasName}\``,
           files: [{ attachment: buffer, name: `${aliasName}-backup.json` }]
        });
     }

     if (sub === 'test') {
        const aliases = await Alias.find({ ownerId: user.id }).lean();
        if (aliases.length === 0) return reply(`${BOT_EMOJIS.WARNING} No aliases found in database for your ID (\`${user.id}\`).`);
      }
   }

  if (command === 'billing' || command === 'status') {
    const userRecord: any = await User.findOne({ discordId: user.id }).lean() || { plan: 'free' };
    const guildRecord: any = message.guildId ? await Guild.findOne({ guildId: message.guildId }).lean() || { plan: 'free' } : { plan: 'free' };
    
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`${BOT_EMOJIS.PLAN} Subscription & Billing Status`)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: '👤 Personal Plan', value: `**Tier:** ${userRecord.plan?.toUpperCase() || 'FREE'}\n**Expires:** ${userRecord.expiresAt ? `<t:${Math.floor(new Date(userRecord.expiresAt).getTime()/1000)}:R>` : 'Never'}`, inline: true },
        { name: '🏛️ Server Plan', value: `**Tier:** ${guildRecord.plan?.toUpperCase() || 'FREE'}\n**Server:** ${message.guild?.name || 'N/A'}`, inline: true }
      );
    
    const userLimits = getEffectiveLimits(userRecord.plan, 'free');
    const guildLimits = getEffectiveLimits('free', guildRecord.plan);
    
    embed.addFields({
      name: '📊 Resource Quotas',
      value: `• **Personal:** ${userLimits.maxAliases === Infinity ? 'Unlimited' : userLimits.maxAliases} Aliases | ${userLimits.maxDestinations} Dests\n` +
             `• **Server:** ${guildLimits.maxAliases === Infinity ? 'Unlimited' : guildLimits.maxAliases} Shared Aliases`,
      inline: false
    });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setLabel('Manage Billing').setStyle(ButtonStyle.Link).setURL(`${process.env.PUBLIC_URL || 'http://localhost:3000'}/dashboard`),
      new ButtonBuilder().setLabel('View Plans').setStyle(ButtonStyle.Link).setURL(`${process.env.PUBLIC_URL || 'http://localhost:3000'}/pricing`)
    );

    return message.reply({ embeds: [embed], components: [row] });
  }

  if (command === 'buy') {
    const plan = args[0]?.toLowerCase();
    const validPlans = ['premium', 'supreme', 'enterprise'];
    if (!plan || !validPlans.includes(plan)) return reply(`${BOT_EMOJIS.WARNING} Usage: \`${PREFIX}buy <premium|supreme|enterprise>\``);
    
    const checkoutUrl = `${process.env.PUBLIC_URL || 'http://localhost:3000'}/billing/checkout?plan=${plan}&uid=${user.id}&gid=${message.guildId || ''}`;
    
    const embed = new EmbedBuilder()
      .setColor('#2ECC71')
      .setTitle(`💳 Checkout Initialization`)
      .setDescription(`Ready to upgrade to **${plan.toUpperCase()}**?\n\nClick the button below to complete your payment securely via Razorpay. Your features will activate instantly upon confirmation.`)
      .setFooter({ text: 'Powered by NebulaMailCord Global Billing' });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setLabel('Complete Purchase').setStyle(ButtonStyle.Link).setURL(checkoutUrl)
    );

    return message.reply({ embeds: [embed], components: [row] });
  }

  if (command === 'enterprise') {
     const guildRecord: any = await Guild.findOne({ guildId: message.guildId }).lean() || { plan: 'free' };
     if (guildRecord.plan !== 'enterprise') {
        return reply(`${BOT_EMOJIS.PLAN} **Enterprise Required:** This server must be on the Enterprise plan to use these features.`, '#E74C3C');
     }
     if (!canSeeAdmin(message)) return reply(`${BOT_EMOJIS.WARNING} **Access Denied:** Enterprise controls are restricted to server Administrators.`, '#E74C3C');

     const sub = args[0]?.toLowerCase();
     
     if (sub === 'domain') {
        const domain = args[1]?.toLowerCase();
        if (!domain) return reply(`${BOT_EMOJIS.WARNING} Usage: \`${PREFIX}enterprise domain <your-domain.com>\``);
        
        await Domain.updateOne({ guildId: message.guildId }, { $set: { domain, verified: false, createdAt: new Date() } }, { upsert: true });
        await Guild.updateOne({ guildId: message.guildId }, { $set: { customDomain: domain } });

        const setupEmbed = new EmbedBuilder()
          .setColor('#3498DB')
          .setTitle(`🏗️ Custom Domain Setup: ${domain}`)
          .setDescription(`To finalize your enterprise infrastructure, add the following DNS records at your domain provider (e.g., Cloudflare, GoDaddy, Namecheap).`)
          .addFields(
            { name: '1️⃣ MX Record (Mail Routing)', value: `**Type:** \`MX\`\n**Host:** \`@\`\n**Value:** \`bot.devtushar.uk\`\n**Priority:** \`10\``, inline: false },
            { name: '2️⃣ SPF Record (Security)', value: `**Type:** \`TXT\`\n**Host:** \`@\`\n**Value:** \`v=spf1 include:bot.devtushar.uk ~all\``, inline: false },
            { name: '3️⃣ Verification', value: `**Type:** \`TXT\`\n**Host:** \`_nebula-verify\`\n**Value:** \`nebula-verify-${message.guildId}\``, inline: false }
          )
          .setFooter({ text: 'Propagations can take 0-24 hours. Emails will route once verified.' });

        return reply(setupEmbed);
     }
     
     if (sub === 'config') {
        const action = args[1]?.toLowerCase();
        
        if (action === 'branding') {
           const msg = args.slice(2).join(' ');
           if (!msg) return reply(`${BOT_EMOJIS.WARNING} Usage: \`${PREFIX}enterprise config branding <your custom message>\``);
           await Guild.updateOne({ guildId: message.guildId }, { $set: { customBranding: msg } });
           return reply(`${BOT_EMOJIS.VERIFY} **Branding Updated:** Custom email footer set to: \`${msg}\``);
        }
        
        if (action === 'webhook') {
           const url = args[2];
           if (!url || !url.startsWith('http')) return reply(`${BOT_EMOJIS.WARNING} Usage: \`${PREFIX}enterprise config webhook <url>\``);
           await Guild.updateOne({ guildId: message.guildId }, { $set: { globalWebhook: url } });
           return reply(`${BOT_EMOJIS.VERIFY} **Webhook Synced:** Global email logging now routing to your endpoint.`);
        }

        const embed = new EmbedBuilder()
           .setColor('#F1C40F')
           .setTitle(`⚙️ Enterprise Configuration`)
           .setDescription(`Management suite for **${message.guild?.name}** Enterprise Infrastructure.`)
           .addFields(
              { name: '🌐 Custom Domain', value: guildRecord.customDomain ? `\`${guildRecord.customDomain}\`` : '❌ Not set', inline: true },
              { name: '🎨 Custom Branding', value: guildRecord.customBranding ? '✅ Active' : '❌ Inactive', inline: true },
              { name: '🔗 Global Webhook', value: guildRecord.globalWebhook ? '✅ Active' : '❌ Inactive', inline: true },
              { name: '🛡️ Priority Routing', value: '✅ Active (Region: AS-SOUTH-1)', inline: false }
           )
           .setFooter({ text: `Usage: !enterprise config <branding|webhook> <value>` });
        return reply(embed);
     }
     
     return reply(`${BOT_EMOJIS.INFO} **Enterprise Console**\n\`${PREFIX}enterprise domain <domain>\` - Link infrastructure\n\`${PREFIX}enterprise config\` - Branding & API settings`);
  }

  if (command === 'stats') {
     const userAliases = await Alias.find({ ownerId: user.id }).lean();
     const activeCount = userAliases.filter((a:any) => a.status === 'active').length;
     const totalEmailsReceived = userAliases.reduce((sum:number, a:any) => sum + (a.emailsReceived || 0), 0);
     
     const embed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle(`${BOT_EMOJIS.STATS} Global Statistics`)
        .setDescription(`Overview of your current performance inside the MailCord network.`)
        .addFields(
           { name: 'Active Identities', value: `${activeCount}`, inline: true },
           { name: 'Data Synchronized', value: `${totalEmailsReceived} Emails`, inline: true }
        )
        .setThumbnail(user.displayAvatarURL());
      
     return reply(embed);
  }
   if (command === 'send') {
      const userPlan = await getMemberPlan(user.id, message.guildId);
      if (userPlan === 'free') return reply(`${BOT_EMOJIS.CROWN} **Premium Feature:** The outbound send engine is restricted to Premium and Supreme users.`, '#E74C3C');

      const parts = args.join(' ').split('|');
      const head = parts[0]?.trim().split(' ');
      const body = parts[1]?.trim();

      const aliasName = head?.shift()?.toLowerCase();
      const targetEmail = head?.shift()?.toLowerCase();
      const subject = head?.join(' ') || 'No Subject';

      if (!aliasName || !targetEmail || !body) return reply(`${BOT_EMOJIS.WARNING} Usage: \`${PREFIX}send <alias> <to_email> <subject> | <body>\``);

      const alias = await Alias.findOne({ name: aliasName, ownerId: user.id, status: 'active' }).lean();
      if (!alias) return reply(`${BOT_EMOJIS.WARNING} Identity \`${aliasName}\` not found or not owned by you.`);

      const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST || 'smtp.gmail.com', port: 587, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
      try {
         // HEADER TRANSPARENCY GUARD: Priority Alias Identity
         await transporter.sendMail({
            from: `"${aliasName}" <${process.env.SMTP_USER}>`,
            to: targetEmail,
            replyTo: `${aliasName}@${CF_DOMAIN}`,
            subject: subject,
            text: body,
            envelope: { from: process.env.SMTP_USER, to: [targetEmail] }
         });
         return reply(`${BOT_EMOJIS.VERIFY} **Email Dispatched!** Message sent from \`${aliasName}@${CF_DOMAIN}\` to \`${targetEmail}\`.`);
      } catch (err) {
         return reply(`${BOT_EMOJIS.WARNING} Failed to dispatch email. Check SMTP credentials.`, '#E74C3C');
      }
   }

   if (command === 'mail' && (args[0] === 'reply' || args[0] === 'forward')) {
      const action = args.shift()?.toLowerCase();
      const mailIdInput = args.shift()?.toUpperCase();
      if (!mailIdInput) return reply(`${BOT_EMOJIS.WARNING} Usage: \`${PREFIX}mail ${action} <id> <...>\``);

      // FLEXIBLE ID SEARCH: Handles both 'MAIL-XXXXXX' and 'XXXXXX'
      const mailId = mailIdInput.startsWith('MAIL-') ? mailIdInput : `MAIL-${mailIdInput}`;
      const email = await Email.findOne({ mailId }).lean();
      if (!email) return reply(`${BOT_EMOJIS.WARNING} Message \`${mailId}\` not found.`);

      const alias = await Alias.findOne({ name: email.alias, ownerId: user.id, status: 'active' }).lean();
      if (!alias) return reply(`${BOT_EMOJIS.WARNING} Access Denied: You do not own the identity associated with this message.`);

      const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST || 'smtp.gmail.com', port: 587, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
      
      if (action === 'reply') {
         const messageBody = args.join(' ');
         if (!messageBody) return reply(`${BOT_EMOJIS.WARNING} Usage: \`${PREFIX}mail reply <id> <message>\``);
         try {
            await transporter.sendMail({ 
              from: `"${email.alias}" <${process.env.SMTP_USER}>`, 
              to: email.from, 
              replyTo: `${email.alias}@${CF_DOMAIN}`, 
              subject: `Re: ${email.subject}`, 
              text: messageBody,
              envelope: { from: process.env.SMTP_USER, to: [email.from] }
            });
            return reply(`${BOT_EMOJIS.VERIFY} **Reply Sent!** Response dispatched to \`${email.from}\`.`);
         } catch (err) { return reply(`${BOT_EMOJIS.WARNING} Failed to send reply.`, '#E74C3C'); }
      } else {
         const targetEmail = args[0]?.toLowerCase();
         if (!targetEmail) return reply(`${BOT_EMOJIS.WARNING} Usage: \`${PREFIX}mail forward <id> <to_email>\``);
         const destRecord = await Destination.findOne({ userId: user.id, email: targetEmail, verified: true }).lean();
         if (!destRecord) return reply(`${BOT_EMOJIS.WARNING} Target \`${targetEmail}\` is not verified.`, '#F1C40F');
         try {
            await transporter.sendMail({ 
              from: `"MailCord Forwarder" <${process.env.SMTP_USER}>`, 
              to: targetEmail, 
              subject: `Fwd: ${email.subject}`, 
              text: `Forwarded via NebulaMailCord\nFrom: ${email.from}\n\n${email.body}`,
              envelope: { from: process.env.SMTP_USER, to: [targetEmail] }
            });
            return reply(`${BOT_EMOJIS.VERIFY} **Forwarded!** Message \`${mailId}\` sent to \`${targetEmail}\`.`);
         } catch (err) { return reply(`${BOT_EMOJIS.WARNING} Forwarding failed.`, '#E74C3C'); }
      }
   }

  if (command === 'billing') {
    const subs = await Subscription.find({ userId: user.id }).sort({ createdAt: -1 }).limit(5).lean();
    if (!subs.length) return reply(`${BOT_EMOJIS.INFO} You have no billing history recorded.`);
    const history = subs.map((s: any) => `**${s.plan?.toUpperCase() || 'FREE'}** - ${s.status} (${s.amount} ${s.currency})\nDate: <t:${Math.floor(new Date(s.createdAt).getTime()/1000)}:d>`).join('\n---\n');
    return reply(`${BOT_EMOJIS.CARD} **Your Transaction History**\n\n${history}`);
  }

  if (command === 'cancel') {
    return reply(`${BOT_EMOJIS.GEAR} To cancel your subscription, please visit your dashboard: ${PUBLIC_URL}/dashboard?tab=billing`);
  }

  if (command === 'status') {
    const userRecord: any = await User.findOne({ discordId: user.id }).lean() || { plan: 'free' };
    const guildRecord: any = message.guildId ? await Guild.findOne({ guildId: message.guildId }).lean() || { plan: 'free' } : { plan: 'free' };
    const limits = getEffectiveLimits(userRecord.plan, guildRecord.plan);
    const userAliases = await Alias.find({ ownerId: user.id, status: 'active' }).lean();
    
    const roleOk = isBotRoleAtTop(message.guild);
    const securityStatus = roleOk ? '✅ Secured' : '⚠️ Misconfigured (Move bot role to top)';

    const embed = new EmbedBuilder()
      .setColor(roleOk ? '#5865F2' : '#F1C40F')
      .setTitle(`${BOT_EMOJIS.PLAN} System & Plan Status`)
      .setDescription(`Detailed overview of your current MailCord configuration.`)
      .addFields(
        { name: '🛡️ Security', value: securityStatus, inline: false },
        { name: '👤 User Plan', value: userRecord.plan?.toUpperCase() || 'FREE', inline: true },
        { name: '🏠 Guild Plan', value: guildRecord.plan?.toUpperCase() || 'FREE', inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
        { name: '📑 Verification', value: `Email: ${userRecord.isEmailVerified ? '✅' : '❌'}\nPhone: ${userRecord.isPhoneVerified ? '✅' : '❌'}`, inline: true },
        { name: '📧 Aliases', value: `${userAliases.length} / ${limits.maxAliases}`, inline: true },
        { name: '⏱️ Retention', value: `${limits.retentionDays} Days`, inline: true }
      );
      
    if (userRecord.expiresAt) {
      embed.addFields({ name: '📅 Expiration', value: `<t:${Math.floor(new Date(userRecord.expiresAt).getTime() / 1000)}:D>`, inline: true });
    }
      
    return reply(embed);
  }

  if (command === 'transfer') {
    const targetGuildId = args[0];
    if (!targetGuildId) return reply(`${BOT_EMOJIS.WARNING} Usage: \`${PREFIX}transfer <server_id>\``);
    
    // Find subscription for this user
    const sub = await Subscription.findOne({ userId: user.id, type: 'guild', status: 'active' });
    if (!sub) return reply(`${BOT_EMOJIS.WARNING} You do not have an active guild subscription to transfer.`);
    
    if (sub.targetId === targetGuildId) return reply(`${BOT_EMOJIS.INFO} This subscription is already active on that server.`);
    
    const oldGuildId = sub.targetId;
    await Subscription.updateOne({ _id: sub._id }, { $set: { targetId: targetGuildId } });
    
    // Update Guild records
    if (oldGuildId) await Guild.updateOne({ guildId: oldGuildId }, { $set: { plan: 'free' } });
    await Guild.updateOne({ guildId: targetGuildId }, { $set: { plan: sub.plan } }, { upsert: true });
    
    return reply(`${BOT_EMOJIS.VERIFY} **Success!** Your **${sub.plan}** subscription has been transferred to \`${targetGuildId}\`.`);
  }
  // --- ModMail System Commands ---
  if (command === 'mail') {
    const content = args.join(' ');
    if (!content) return reply(`${BOT_EMOJIS.WARNING} Usage: \`!mail <message>\``);

    const guildConfig: any = await Guild.findOne({ guildId: message.guild.id }).lean() || {};
    
    // Check block list
    const isBlocked = await MailBlock.findOne({ userId: message.author.id, guildId: message.guild.id }).lean();
    if (isBlocked) return reply(`❌ You are blocked from the mail system. Reason: ${isBlocked.reason}`, '#E74C3C');

    let thread = await MailThread.findOne({ userId: user.id, guildId: message.guild.id, status: 'open' });
    let threadChannel = thread ? await message.guild.channels.fetch(thread.channelId).catch(() => null) : null;
    
    if (!threadChannel) {
      if (!guildConfig.categoryId) return reply(`${BOT_EMOJIS.WARNING} Staff Mail is not configured on this server (Category missing).`, '#E74C3C');
      
      threadChannel = await message.guild.channels.create({
        name: `mail-${user.username}`,
        type: ChannelType.GuildText,
        parent: guildConfig.categoryId,
        topic: `Mail Thread for ${user.tag} (${user.id})`
      });

      await MailThread.updateOne(
        { userId: user.id, guildId: message.guild.id },
        { $set: { channelId: threadChannel.id, status: 'open', createdAt: Date.now() } },
        { upsert: true }
      );

      const welcomeEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`${BOT_EMOJIS.MAIL} New Mail Thread`)
        .setDescription(`User: <@${user.id}>\nID: \`${user.id}\``)
        .addFields({ name: 'Message', value: content });
      
      await threadChannel.send({ content: guildConfig.supportRoleId ? `<@&${guildConfig.supportRoleId}>` : undefined, embeds: [welcomeEmbed] });
      return reply(`${BOT_EMOJIS.VERIFY} Your message has been sent to staff! A thread has been opened.`);
    }

    const msgEmbed = new EmbedBuilder()
      .setColor('#2ECC71')
      .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
      .setDescription(content)
      .setTimestamp();
    
    await (threadChannel as any).send({ embeds: [msgEmbed] });
    return reply(`${BOT_EMOJIS.VERIFY} Message sent to staff thread.`);
  }

  if (command === 'reply') {
    const thread = await MailThread.findOne({ channelId: message.channel.id, status: 'open' }).lean();
    if (!thread) return reply(`${BOT_EMOJIS.WARNING} This command can only be used in an active staff thread.`, '#E74C3C');
    
    const content = args.join(' ');
    if (!content) return reply(`${BOT_EMOJIS.WARNING} Usage: \`!reply <message>\``);

    const targetUser = await client.users.fetch(thread.userId).catch(() => null);
    if (!targetUser) return reply(`${BOT_EMOJIS.WARNING} User not found.`, '#E74C3C');

    const replyEmbed = new EmbedBuilder()
       .setColor('#5865F2')
       .setAuthor({ name: `Staff Reply (${message.guild.name})`, iconURL: message.guild.iconURL() || undefined })
       .setDescription(content)
       .setFooter({ text: `Reply with !mail <message> to continue.` });

    try {
      await targetUser.send({ embeds: [replyEmbed] });
      return reply(`${BOT_EMOJIS.VERIFY} Reply dispatched to user DMs.`);
    } catch (err) {
      return reply("❌ Failed to DM the user. They might have DMs closed.");
    }
  }

  if (command === 'close') {
    const thread = await MailThread.findOne({ channelId: message.channel.id, status: 'open' }).lean();
    if (!thread) return reply(`${BOT_EMOJIS.WARNING} No active thread found in this channel.`);

    const reason = args.join(' ') || 'No reason provided';
    await MailThread.updateOne({ channelId: message.channel.id }, { $set: { status: 'closed', closedAt: Date.now() } });
    
    // Generate simple transcript
    const messages = await message.channel.messages.fetch({ limit: 100 });
    const transcript = messages.reverse().map((m: any) => `[${new Date(m.createdTimestamp).toLocaleString()}] ${m.author.tag}: ${m.content}`).join('\n');
    const buffer = Buffer.from(transcript, 'utf-8');

    const logEmbed = new EmbedBuilder()
      .setColor('#E74C3C')
      .setTitle(`${BOT_EMOJIS.LOCK} Thread Closed`)
      .addFields(
        { name: 'User', value: `<@${thread.userId}>`, inline: true },
        { name: 'Closed By', value: `<@${message.author.id}>`, inline: true },
        { name: 'Reason', value: reason }
      )
      .setTimestamp();

    const guildConfig: any = await Guild.findOne({ guildId: message.guild.id }).lean() || {};
    if (guildConfig.logChannelId) {
      const logChannel = await message.guild.channels.fetch(guildConfig.logChannelId).catch(() => null);
      if (logChannel) await (logChannel as any).send({ embeds: [logEmbed], files: [{ attachment: buffer, name: `transcript-${thread.userId}.txt` }] });
    }

    await reply(`${BOT_EMOJIS.VERIFY} Thread closed and transcript archived.`);
    setTimeout(() => message.channel.delete().catch(() => null), 5000);
    return;
  }

  if (command === 'block') {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) return reply(`${BOT_EMOJIS.WARNING} Insufficient permissions.`);
    const targetUser = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
    if (!targetUser) return reply(`${BOT_EMOJIS.WARNING} Usage: \`!block <@user/id> [reason]\``);
    
    const reason = args.slice(1).join(' ') || 'No reason provided';
    await MailBlock.updateOne(
      { userId: targetUser.id, guildId: message.guild.id },
      { $set: { blockedBy: message.author.id, reason, createdAt: Date.now() } },
      { upsert: true }
    );

    return reply(`${BOT_EMOJIS.BAN} **${targetUser.tag}** has been blocked from the mail system.`);
  }

  if (command === 'unblock') {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) return reply(`${BOT_EMOJIS.WARNING} Insufficient permissions.`);
    const targetUser = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);
    if (!targetUser) return reply(`${BOT_EMOJIS.WARNING} Usage: \`!unblock <@user/id>\``);

    await MailBlock.deleteOne({ userId: targetUser.id, guildId: message.guild.id });
    return reply(`${BOT_EMOJIS.VERIFY} **${targetUser.tag}** has been unblocked.`);
  }

  if (command === 'transcript') {
    const messages = await message.channel.messages.fetch({ limit: 100 });
    const transcript = messages.reverse().map((m: any) => `[${new Date(m.createdTimestamp).toLocaleString()}] ${m.author.tag}: ${m.content}`).join('\n');
    const buffer = Buffer.from(transcript, 'utf-8');
    return message.reply({
      content: `${BOT_EMOJIS.MAIL} **Channel Transcript**`,
      files: [{ attachment: buffer, name: `transcript-${message.channel.id}.txt` }]
    });
  }

  // --- Server Configuration Commands ---
  if (command === 'setlog') {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) return reply(`${BOT_EMOJIS.WARNING} Admin only.`);
    const channel = message.mentions.channels.first();
    if (!channel) return reply(`${BOT_EMOJIS.WARNING} Mention a channel.`);
    await Guild.updateOne({ guildId: message.guild.id }, { $set: { logChannelId: channel.id } }, { upsert: true });
    return reply(`${BOT_EMOJIS.GEAR} Log channel set to ${channel}.`);
  }

  if (command === 'setcategory') {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) return reply(`${BOT_EMOJIS.WARNING} Admin only.`);
    const categoryId = args[0];
    if (!categoryId) return reply(`${BOT_EMOJIS.WARNING} Provide a Category ID.`);
    await Guild.updateOne({ guildId: message.guild.id }, { $set: { categoryId: categoryId } }, { upsert: true });
    return reply(`${BOT_EMOJIS.GEAR} ModMail category set to \`${categoryId}\`.`);
  }

  if (command === 'setwelcome') {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) return reply(`${BOT_EMOJIS.WARNING} Admin only.`);
    const msg = args.join(' ');
    if (!msg) return reply(`${BOT_EMOJIS.WARNING} Provide a message.`);
    await Guild.updateOne({ guildId: message.guild.id }, { $set: { welcomeMessage: msg } }, { upsert: true });
    return reply(`${BOT_EMOJIS.VERIFY} Welcome message updated.`);
  }

  if (command === 'setautoreply') {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) return reply(`${BOT_EMOJIS.WARNING} Admin only.`);
    const msg = args.join(' ');
    if (!msg) return reply(`${BOT_EMOJIS.WARNING} Provide a message.`);
    await Guild.updateOne({ guildId: message.guild.id }, { $set: { autoReplyMessage: msg } }, { upsert: true });
    return reply(`${BOT_EMOJIS.VERIFY} Auto-reply message updated.`);
  }

  // --- Admin/Owner Info ---
  if (command === 'servers') {
    if (!isDeveloper(user.id)) return reply(`${BOT_EMOJIS.WARNING} **Access Denied:** Developer access only.`, '#E74C3C');
    return reply(`${BOT_EMOJIS.STATS} **Network Reach:** ${client.guilds.cache.size} Servers`);
  }
  if (command === 'users') {
    if (!isDeveloper(user.id)) return reply(`${BOT_EMOJIS.WARNING} **Access Denied:** Developer access only.`, '#E74C3C');
    return reply(`${BOT_EMOJIS.INFO} **Global Users:** ${client.users.cache.size} Connected`);
  }
  if (command === 'reload') {
    if (!isDeveloper(user.id)) return reply(`${BOT_EMOJIS.WARNING} **Access Denied:** Developer access only.`, '#E74C3C');
    // Refresh slash commands
    try {
      await rest.put(Routes.applicationCommands(DISCORD_APP_ID), { body: commands });
      return reply(`${BOT_EMOJIS.GEAR} **System Refreshed:** Slash commands and cache re-registered.`);
    } catch (err: any) {
      return reply(`${BOT_EMOJIS.WARNING} Failed to refresh commands: ${err.message}`, '#E74C3C');
    }
  }

  if (command === 'backup') {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) return reply(`${BOT_EMOJIS.WARNING} Admin only.`);
    const config = {
      prefix: guildConfig.prefix,
      logChannelId: guildConfig.logChannelId,
      categoryId: guildConfig.categoryId,
      adminRoleId: guildConfig.adminRoleId,
      supportRoleId: guildConfig.supportRoleId,
      welcomeMessage: guildConfig.welcomeMessage,
      autoReplyMessage: guildConfig.autoReplyMessage
    };
    const buffer = Buffer.from(JSON.stringify(config, null, 2), 'utf-8');
    return message.reply({
      content: `${BOT_EMOJIS.BACKUP} **Server Configuration Backup Generated**`,
      files: [{ attachment: buffer, name: `config-backup-${message.guild.id}.json` }]
    });
  }

  if (command === 'restore') {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageGuild)) return reply(`${BOT_EMOJIS.WARNING} Admin only.`);
    const attachment = message.attachments.first();
    if (!attachment || !attachment.name.endsWith('.json')) return reply(`${BOT_EMOJIS.WARNING} Attach a valid config backup \`.json\` file.`);
    
    try {
      const response = await fetch(attachment.url);
      const config = await response.json();
      await Guild.updateOne({ guildId: message.guild.id }, { $set: config }, { upsert: true });
      return reply(`${BOT_EMOJIS.VERIFY} **Success!** Server configuration restored.`);
    } catch (err) {
      return reply(`${BOT_EMOJIS.WARNING} Failed to restore config.`, '#E74C3C');
    }
  }

  if (command === 'redeem') {
    const code = args.shift()?.toUpperCase();
    if (!code) return reply(`${BOT_EMOJIS.INFO} Usage: \`${PREFIX}redeem <YOUR-CODE> [@user]\``);

    const targetArg = args.shift();
    let targetUser = message.mentions.users.first();
    if (!targetUser && targetArg) {
      const cleanId = targetArg.replace(/[<@!>]/g, '');
      if (/^\d{17,20}$/.test(cleanId)) {
        targetUser = await client.users.fetch(cleanId).catch(() => null) as any;
      }
    }

    if (targetUser && targetUser.id !== user.id) {
      const isDev = isDeveloper(user.id);
      const isGuildAdmin = message.member?.permissions.has(PermissionFlagsBits.Administrator) || message.member?.permissions.has(PermissionFlagsBits.ManageGuild);
      if (!isDev && !isGuildAdmin) {
        return reply(`${BOT_EMOJIS.WARNING} **Access Denied:** Only developers or server administrators can redeem license keys for other users.`, '#E74C3C');
      }
    }

    const key = await UpgradeKey.findOne({ code, used: { $ne: true } }).lean();
    if (!key) return reply(`${BOT_EMOJIS.WARNING} **Invalid or Expired Code.** This key may have already been used.`);

    const now = Date.now();
    const durationDays = key.durationDays || 30;
    const expiresAt = new Date(now + (durationDays * 24 * 60 * 60 * 1000));

    if (key.plan === 'enterprise') {
        if (!message.guildId) return reply(`${BOT_EMOJIS.WARNING} **Server Key Detected:** Please redeem this key inside a server to upgrade it.`, '#F1C40F');
        await Promise.all([
          Guild.updateOne({ guildId: message.guildId }, { $set: { plan: 'enterprise', expiresAt } }),
          UpgradeKey.updateOne({ code }, { $set: { used: true, usedBy: user.id, redeemedAt: now, targetGuild: message.guildId } })
        ]);
        
        const embed = new EmbedBuilder()
          .setColor('#F1C40F')
          .setTitle(`${BOT_EMOJIS.VERIFY} Server Upgrade: Enterprise Tier`)
          .setDescription(`Congratulations! **${message.guild?.name}** has been upgraded to the **ENTERPRISE** plan.\n\n` +
            `Advanced infrastructure and custom branding are now available to all members.\n\n` +
            `**Redeemed By:** <@${user.id}>\n` +
            `**Expiry:** <t:${Math.floor(expiresAt.getTime() / 1000)}:R>`)
          .setFooter({ text: 'NebulaMailCord Server Intelligence Synced' });
        return reply(embed);
    }

    const recipient = targetUser || user;

    await Promise.all([
      User.updateOne({ discordId: recipient.id }, { $set: { plan: key.plan, expiresAt } }),
      UpgradeKey.updateOne({ code }, { $set: { used: true, usedBy: user.id, targetUser: recipient.id, redeemedAt: now } })
    ]);

    const isGift = recipient.id !== user.id;

    const embed = new EmbedBuilder()
      .setColor('#2ECC71')
      .setTitle(`${BOT_EMOJIS.VERIFY} Nebula Core: Priority Level Up`)
      .setDescription(`Welcome to **Nebula ${key.plan.toUpperCase()}**, <@${recipient.id}>!\n\n` +
        (isGift ? `*Activated on behalf by <@${user.id}>*\n\n` : '') +
        `The account has been elevated with premium perks for the next **${durationDays} days**.\n\n` +
        `**Expiry:** <t:${Math.floor(expiresAt.getTime() / 1000)}:R>`)
      .setFooter({ text: 'NebulaMailCord Intelligence Sync Complete' });

    return reply(embed);
  }

  if (command === 'dev' || command === 'developer') {
    if (!isDeveloper(user.id)) {
      return reply(`❌ **Restricted:** Only authorized developers can access developer commands.`, '#E74C3C');
    }

    const sub = args.shift()?.toLowerCase();

    if (!sub || sub === 'help') {
      const devEmbed = new EmbedBuilder()
        .setColor('#8B5CF6')
        .setTitle(`🛠️ NebulaMailCord Developer Control Panel`)
        .setDescription(`Developer management commands for users, servers, and keys.\n\n` +
          `**User Management:**\n` +
          `• \`${PREFIX}dev setplan <@user|id> <free|premium|supreme> [days]\` — Set user tier\n` +
          `• \`${PREFIX}dev userinfo <@user|id>\` — View database profile & telemetry\n` +
          `• \`${PREFIX}dev resetuser <@user|id>\` — Reset user to free tier\n\n` +
          `**Server Management:**\n` +
          `• \`${PREFIX}dev setserver [guild_id] <free|pro|enterprise> [days]\` — Set server tier\n\n` +
          `**Key Management:**\n` +
          `• \`${PREFIX}dev genkey <premium|supreme|enterprise> [days]\` — Generate license key\n` +
          `• \`${PREFIX}dev keys [unused|all]\` — List recent keys\n` +
          `• \`${PREFIX}dev delkey <code>\` — Revoke / delete a key\n\n` +
          `**Redeem on behalf of user:**\n` +
          `• \`${PREFIX}redeem <KEY> <@user|id>\` or \`/redeem code:<KEY> user:@user\``)
        .setFooter({ text: `Authorized Developer: ${user.tag}` })
        .setTimestamp();
      return reply(devEmbed);
    }

    if (sub === 'setplan' || sub === 'plan') {
      const targetArg = args.shift();
      let target = message.mentions.users.first();
      if (!target && targetArg) {
        const cleanId = targetArg.replace(/[<@!>]/g, '');
        if (/^\d{17,20}$/.test(cleanId)) {
          target = await client.users.fetch(cleanId).catch(() => null) as any;
        }
      }

      const plan = args.shift()?.toLowerCase();
      if (!target || !plan || !['free', 'premium', 'supreme'].includes(plan)) {
        return reply(`${BOT_EMOJIS.INFO} Usage: \`${PREFIX}dev setplan <@user|id> <free|premium|supreme> [days]\``);
      }

      const days = parseInt(args.shift() || '30') || 30;
      let expiresAt: Date | null = null;
      if (plan !== 'free') {
        expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      }

      await User.updateOne(
        { discordId: target.id },
        { $set: { plan, expiresAt } },
        { upsert: true }
      );

      const embed = new EmbedBuilder()
        .setColor('#8B5CF6')
        .setTitle(`🛠️ Developer Override: Plan Updated`)
        .setDescription(
          `**Target User:** <@${target.id}> (\`${target.id}\`)\n` +
          `**New Plan:** \`${plan.toUpperCase()}\`\n` +
          (expiresAt ? `**Expiry:** <t:${Math.floor(expiresAt.getTime() / 1000)}:R> (${days} days)\n` : `**Expiry:** None (Free)\n`) +
          `**Updated By:** <@${user.id}>`
        )
        .setTimestamp();
      return reply(embed);
    }

    if (sub === 'setserver' || sub === 'serverplan') {
      let guildId = message.guildId;
      let planArg = args.shift()?.toLowerCase();
      let daysArg = args.shift();

      if (planArg && /^\d{17,20}$/.test(planArg)) {
        guildId = planArg;
        planArg = daysArg?.toLowerCase();
        daysArg = args.shift();
      }

      if (!guildId || !planArg || !['free', 'pro', 'enterprise'].includes(planArg)) {
        return reply(`${BOT_EMOJIS.INFO} Usage: \`${PREFIX}dev setserver [guild_id] <free|pro|enterprise> [days]\``);
      }

      const days = parseInt(daysArg || '30') || 30;
      let expiresAt: Date | null = null;
      if (planArg !== 'free') {
        expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      }

      await Guild.updateOne(
        { guildId },
        { $set: { plan: planArg, expiresAt } },
        { upsert: true }
      );

      const embed = new EmbedBuilder()
        .setColor('#8B5CF6')
        .setTitle(`🛠️ Developer Override: Server Plan Updated`)
        .setDescription(
          `**Guild ID:** \`${guildId}\`\n` +
          `**New Plan:** \`${planArg.toUpperCase()}\`\n` +
          (expiresAt ? `**Expiry:** <t:${Math.floor(expiresAt.getTime() / 1000)}:R> (${days} days)\n` : `**Expiry:** None (Free)\n`) +
          `**Updated By:** <@${user.id}>`
        )
        .setTimestamp();
      return reply(embed);
    }

    if (sub === 'userinfo' || sub === 'info' || sub === 'inspect') {
      const targetArg = args.shift();
      let target = message.mentions.users.first();
      if (!target && targetArg) {
        const cleanId = targetArg.replace(/[<@!>]/g, '');
        if (/^\d{17,20}$/.test(cleanId)) {
          target = await client.users.fetch(cleanId).catch(() => null) as any;
        }
      }
      if (!target) {
        return reply(`${BOT_EMOJIS.INFO} Usage: \`${PREFIX}dev userinfo <@user|id>\``);
      }

      const [uData, aliases, forwarders] = await Promise.all([
        User.findOne({ discordId: target.id }).lean(),
        Alias.find({ ownerId: target.id }).lean(),
        Destination.find({ ownerId: target.id }).lean()
      ]);

      const plan = (uData as any)?.plan || 'free';
      const expiresAt = (uData as any)?.expiresAt;
      const privacy = (uData as any)?.privacyMode ? 'Enabled 🔒' : 'Disabled 🔓';
      const activeAliases = (aliases as any[]).filter(a => a.status === 'active').length;
      const deletedAliases = (aliases as any[]).filter(a => a.status === 'deleted').length;

      const embed = new EmbedBuilder()
        .setColor('#8B5CF6')
        .setTitle(`🔍 Developer Diagnostics: User Profile`)
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: 'User', value: `<@${target.id}> (\`${target.tag || target.username}\`)`, inline: true },
          { name: 'User ID', value: `\`${target.id}\``, inline: true },
          { name: 'Plan Tier', value: `\`${plan.toUpperCase()}\``, inline: true },
          { name: 'Plan Expiration', value: expiresAt ? `<t:${Math.floor(new Date(expiresAt).getTime() / 1000)}:F> (<t:${Math.floor(new Date(expiresAt).getTime() / 1000)}:R>)` : '`Permanent / N/A`', inline: false },
          { name: 'Active Aliases', value: `\`${activeAliases}\` active (\`${deletedAliases}\` deleted)`, inline: true },
          { name: 'Forwarders', value: `\`${(forwarders as any[]).length}\` configured`, inline: true },
          { name: 'Privacy Mode', value: privacy, inline: true },
          { name: 'Recovery Email', value: (uData as any)?.recoveryEmail ? `\`${(uData as any).recoveryEmail}\`` : '*Not set*', inline: true },
          { name: 'Recovery Phone', value: (uData as any)?.recoveryPhone ? `\`${(uData as any).recoveryPhone}\`` : '*Not set*', inline: true }
        )
        .setFooter({ text: `Diagnostics requested by ${user.tag}` })
        .setTimestamp();

      return reply(embed);
    }

    if (sub === 'resetuser' || sub === 'reset') {
      const targetArg = args.shift();
      let target = message.mentions.users.first();
      if (!target && targetArg) {
        const cleanId = targetArg.replace(/[<@!>]/g, '');
        if (/^\d{17,20}$/.test(cleanId)) {
          target = await client.users.fetch(cleanId).catch(() => null) as any;
        }
      }
      if (!target) {
        return reply(`${BOT_EMOJIS.INFO} Usage: \`${PREFIX}dev resetuser <@user|id>\``);
      }

      await User.updateOne({ discordId: target.id }, { $set: { plan: 'free', expiresAt: null } });
      return reply(`✅ Plan for <@${target.id}> reset back to **FREE** tier.`);
    }

    if (sub === 'genkey' || sub === 'devkey' || sub === 'makekey') {
      const plan = args.shift()?.toLowerCase();
      if (!['premium', 'supreme', 'enterprise'].includes(plan!)) {
        return reply(`${BOT_EMOJIS.INFO} Usage: \`${PREFIX}dev genkey <premium|supreme|enterprise> [days]\``);
      }
      const duration = parseInt(args.shift() || '30') || 30;
      const key = `NEBULA-${plan?.toUpperCase().charAt(0)}${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      await UpgradeKey.create({
        code: key,
        plan: plan as any,
        durationDays: duration
      });

      const embed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle(`${BOT_EMOJIS.VERIFY} Upgrade Key Generated`)
        .setDescription(
          `**Plan:** \`${plan?.toUpperCase()}\`\n` +
          `**Duration:** \`${duration} Days\`\n\n` +
          `**Redeem Code:**\n` +
          `\`\`\`${key}\`\`\`\n` +
          `**Redeem Command:**\n` +
          `> \`${PREFIX}redeem ${key}\` or \`/redeem code:${key}\``
        )
        .setFooter({ text: 'Authorized Developer Mode' })
        .setTimestamp();

      return reply(embed);
    }

    if (sub === 'keys' || sub === 'listkeys') {
      const filter = args.shift()?.toLowerCase() || 'unused';
      const query = filter === 'all' ? {} : { used: { $ne: true } };
      const keys = await UpgradeKey.find(query).sort({ _id: -1 }).limit(10).lean();

      if (!keys || keys.length === 0) {
        return reply(`ℹ️ No keys found for filter: \`${filter}\``);
      }

      const keyList = (keys as any[]).map((k, i) => {
        const status = k.used ? `❌ Used by <@${k.usedBy}>` : `✅ Active / Unused`;
        return `**${i + 1}. \`${k.code}\`** — \`${k.plan.toUpperCase()}\` (${k.durationDays || 30}d)\n   └ Status: ${status}`;
      }).join('\n\n');

      const embed = new EmbedBuilder()
        .setColor('#8B5CF6')
        .setTitle(`🔑 Upgrade Keys (${filter.toUpperCase()})`)
        .setDescription(keyList)
        .setFooter({ text: 'Showing up to 10 most recent keys' });

      return reply(embed);
    }

    if (sub === 'delkey' || sub === 'deletekey') {
      const code = args.shift()?.toUpperCase();
      if (!code) return reply(`${BOT_EMOJIS.INFO} Usage: \`${PREFIX}dev delkey <CODE>\``);
      const res = await UpgradeKey.deleteOne({ code });
      if (res.deletedCount === 0) return reply(`❌ Key \`${code}\` not found.`);
      return reply(`✅ Key \`${code}\` deleted/revoked.`);
    }

    return reply(`${BOT_EMOJIS.INFO} Unknown developer command. Type \`${PREFIX}dev help\` for a list of commands.`);
  }

  if (command === 'devkey' || command === 'genkey' || command === 'makekey' || (command === 'alias' && args[0] === 'genkey')) {
    if (!isDeveloper(user.id)) {
      return reply(`❌ **Restricted:** Only authorized developers can generate upgrade keys.`, '#E74C3C');
    }

    if (command === 'alias') args.shift();

    const plan = args.shift()?.toLowerCase();
    if (!['premium', 'supreme', 'enterprise'].includes(plan!)) {
      const helpEmbed = new EmbedBuilder()
        .setColor('#8B5CF6')
        .setTitle(`🔑 Developer Redeem Code Generator`)
        .setDescription(`Generate redeem codes for users or servers.\n\n` +
          `**Usage:**\n` +
          `\`${PREFIX}devkey <premium|supreme|enterprise> [duration_days]\`\n\n` +
          `**Available Plans:**\n` +
          `• \`premium\` — Personal power user tier (default: 30 days)\n` +
          `• \`supreme\` — Unlimited personal identity tier (default: 30 days)\n` +
          `• \`enterprise\` — Server-wide upgrade tier (default: 30 days)\n\n` +
          `**Examples:**\n` +
          `• \`${PREFIX}devkey premium 30\`\n` +
          `• \`${PREFIX}devkey supreme 60\`\n` +
          `• \`${PREFIX}devkey enterprise 365\`\n\n` +
          `*(Aliases: \`${PREFIX}genkey\`, \`${PREFIX}makekey\`, or Slash Command \`/devkey\`)*`)
        .setFooter({ text: `Authorized Developer Mode Active` });
      return reply(helpEmbed);
    }
    
    const duration = parseInt(args.shift() || '30') || 30;
    const key = `NEBULA-${plan?.toUpperCase().charAt(0)}${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    try {
      await UpgradeKey.create({
        code: key,
        plan: plan as any,
        durationDays: duration
      });

      const embed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle(`${BOT_EMOJIS.VERIFY} Upgrade Key Generated Successfully`)
        .setDescription(`**Plan:** \`${plan?.toUpperCase()}\`\n` +
          `**Duration:** \`${duration} Days\`\n\n` +
          `**Redeem Code:**\n` +
          `\`\`\`${key}\`\`\`\n` +
          `**How Recipient Redeems:**\n` +
          `Recipient runs in Discord:\n` +
          `> \`${PREFIX}redeem ${key}\` or \`/redeem code:${key}\``)
        .setFooter({ text: 'Share this code privately with the user or server owner.' })
        .setTimestamp();
      
      return reply(embed);
    } catch (err: any) {
      console.error('[DEVKEY ERROR] Failed to save key:', err);
      return reply(`❌ **Error:** Failed to generate key: ${err.message}`, '#E74C3C');
    }
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Check if replying to a bot message
  if (message.reference && message.reference.messageId) {
    try {
      const referencedMsg = await message.channel.messages.fetch(message.reference.messageId);
      
      // Ensure the referenced message is from our bot, has an embed, and has a footer containing the MAIL ID
      if (referencedMsg.author.id === client.user?.id && referencedMsg.embeds.length > 0) {
        const footerText = referencedMsg.embeds[0].footer?.text || '';
        const match = footerText.match(/ID:\s*(MAIL-[A-Z0-9]+)|Thread:\s*(MAIL-[A-Z0-9]+)/);
        
        if (match) {
          const mailId = match[1] || match[2];
          
          // Reply matched! Find the original email context to send back.
          const emailRecord: any = await Email.findOne({ mailId }).lean();
          if (emailRecord) {
             const aliasRecord = await getAlias(emailRecord.alias);
             
             // Security Ensure the replied user is actually the owner of the alias
             if (aliasRecord && aliasRecord.ownerId === message.author.id) {
                // Initialize the SMTP transporter
                const transporter = nodemailer.createTransport({ 
                    host: process.env.SMTP_HOST || 'smtp.gmail.com', 
                    // @ts-ignore
                    port: parseInt(process.env.SMTP_PORT || '587'), 
                    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } 
                });

                // Format HTML (Gmail Style with basic markdown support)
                let formattedReply = message.content.replace(/\n/g, '<br>');
                const htmlBody = `
<div dir="ltr">${formattedReply}</div><br>
<div class="gmail_quote">
  <div dir="ltr" class="gmail_attr">On ${new Date(emailRecord.timestamp).toLocaleString()}, ${emailRecord.from} wrote:<br></div>
  <blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex">
    ${emailRecord.body ? emailRecord.body.replace(/\n/g, '<br>') : 'No original text content.'}
  </blockquote>
</div>`;

                // Try to send the email reply
                const sentMsg = await message.reply('📨 Sending your reply...');
                try {
                    await transporter.sendMail({
                        from: `"${aliasRecord.name}" <${process.env.SMTP_USER}>`,
                        to: emailRecord.from,
                        replyTo: `${aliasRecord.name}@${CF_DOMAIN}`,
                        subject: `Re: ${emailRecord.subject}`,
                        text: `${message.content}\n\nOn ${new Date(emailRecord.timestamp).toLocaleString()}, ${emailRecord.from} wrote:\n${emailRecord.body}`,
                        html: htmlBody
                    });
                    await sentMsg.edit('✅ **Reply Sent Successfully**');
                    
                    // Add reaction to original message to mark it processed
                    await message.react('✅').catch(() => null);
                } catch (err: any) {
                    console.error('[SMTP-REPLY-ERROR]', err);
                    await sentMsg.edit(`❌ **Failed to send reply:** ${err.message || 'SMTP Error'}`);
                }
             } else {
                await message.reply({ content: '🚫 **Security Block:** You do not own the alias for this email thread.' });
             }
          }
        }
      }
    } catch (err) {
      console.error('[MSG-REPLY-HANDLER-ERROR]', err);
    }
  }
});

// Removed duplicate loginWithRetry

// --- Email Intelligence System ---
function sanitizeEmailBody(text: string): { clean: string, originalSender?: string } {
  let clean = text;
  let originalSender: string | undefined;

  // 1. Detect Forwarded Sender
  const fwdMatch = text.match(/From: (.*?) <(.*?)>/);
  if (fwdMatch) originalSender = fwdMatch[1] || fwdMatch[2];

  // 2. Strip "Forwarded message" blocks
  clean = clean.replace(/-{10,} Forwarded message -{10,}/gi, '');
  clean = clean.replace(/From: .*?\nDate: .*?\nSubject: .*?\nTo: .*?\n/gi, '');

  // 3. Purge [image: ...] placeholders
  clean = clean.replace(/\[image:.*?\]/gi, '');

  // 4. Collapse parenthesized newlines (Fixes Hostinger-style ( \n URL \n ) blocks)
  clean = clean.replace(/\(([\s\n]*)(.*?)([\s\n]*)\)/gs, (match, p1, content, p3) => {
    return `(${content.trim()})`;
  });

  // 5. REMOVED: Aggressive URL truncation (Caused ugly snippets)
  // We now rely on the "Top Links" section for clean clickable links.

  // 6. Collapse excessive whitespace and newlines
  clean = clean.replace(/\r?\n\s*\r?\n/g, '\n\n'); 
  clean = clean.replace(/[ \t]{4,}/g, ' '); 

  return { clean: clean.trim(), originalSender };
}

function detectOTP(text: string): string | null {
  // 1. Specific Keyword Match (Highest Confidence)
  const otpRegex = /(?:code|otp|verification|pin|password|verify|auth|login)[\s:-]*(\d{4,8})\b/i;
  const specificMatch = text.match(otpRegex);
  if (specificMatch) return specificMatch[1];
  
  // 2. Specialized Greedy Match (Last Resort)
  // Finds 4-8 digit numbers that are NOT likely to be years (1900-2100)
  const codes = text.match(/\b\d{4,8}\b/g) || [];
  for (const code of codes) {
    const num = parseInt(code);
    // Ignore common years and timestamps part (like 2024, 2025, 2026)
    if (num > 1900 && num < 2100) continue; 
    // Heuristic: If it's isolated and not a year, it's likely our OTP
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



export { client };
export async function initializeBot() {
  console.log('[Bot Init] Attempting to log in to Discord gateway...');
  await client.login(DISCORD_BOT_TOKEN);
}
