export interface BotCommand {
  name: string;
  category: 'aliases' | 'inbox' | 'security' | 'admin' | 'dev';
  role: 'Everyone' | 'Server Admin' | 'Developer';
  shortcuts: string[];
  description: string;
  example: string;
  params?: { name: string; desc: string }[];
}

export const BOT_COMMAND_CATEGORIES = [
  { id: 'all', label: 'All Commands' },
  { id: 'aliases', label: 'Aliases' },
  { id: 'inbox', label: 'Inbox & Mail' },
  { id: 'security', label: 'Security & Safety' },
  { id: 'admin', label: 'Admin & Setup' },
  { id: 'dev', label: 'Developer & Diagnostics' }
];

export const BOT_COMMANDS: BotCommand[] = [
  {
    name: '!alias create <name>',
    category: 'aliases',
    role: 'Everyone',
    shortcuts: ['!create <name>', '!ac <name>'],
    description: 'Creates a brand new custom email address under the configured domain.',
    example: '!alias create shopping',
    params: [
      { name: '<name>', desc: 'The unique alphanumeric alias name (creates name@bot.devtushar.uk)' }
    ]
  },
  {
    name: '!alias generate',
    category: 'aliases',
    role: 'Everyone',
    shortcuts: ['!generate', '!ag'],
    description: 'Instantly generates a randomized private burner alias (e.g. pulse-cloud-19).',
    example: '!alias generate'
  },
  {
    name: '!alias list',
    category: 'aliases',
    role: 'Everyone',
    shortcuts: ['!aliases', '!al'],
    description: 'Lists all your active email aliases with emails received count and creation dates.',
    example: '!alias list'
  },
  {
    name: '!alias info <name>',
    category: 'aliases',
    role: 'Everyone',
    shortcuts: ['!ai <name>'],
    description: 'Shows detailed metadata, creation date, status, and lock status for an alias.',
    example: '!alias info shopping',
    params: [
      { name: '<name>', desc: 'The alias name to inspect' }
    ]
  },
  {
    name: '!alias rename <old> <new>',
    category: 'aliases',
    role: 'Everyone',
    shortcuts: ['!ar <old> <new>'],
    description: 'Renames an existing alias to a new name while keeping all existing email history.',
    example: '!alias rename shopping purchases',
    params: [
      { name: '<old>', desc: 'Current alias name' },
      { name: '<new>', desc: 'New alias name to apply' }
    ]
  },
  {
    name: '!alias transfer <name> <@user>',
    category: 'aliases',
    role: 'Everyone',
    shortcuts: ['!at <name> <@user>'],
    description: 'Transfers ownership of an email alias to another Discord server member.',
    example: '!alias transfer shopping @alex',
    params: [
      { name: '<name>', desc: 'The alias to transfer' },
      { name: '<@user>', desc: 'Discord mention of the recipient' }
    ]
  },
  {
    name: '!alias lock <name>',
    category: 'security',
    role: 'Everyone',
    shortcuts: ['!lock <name>'],
    description: 'Locks an alias to protect it against accidental deletion or transfer.',
    example: '!alias lock shopping',
    params: [
      { name: '<name>', desc: 'The alias to lock' }
    ]
  },
  {
    name: '!alias unlock <name>',
    category: 'security',
    role: 'Everyone',
    shortcuts: ['!unlock <name>'],
    description: 'Unlocks a previously locked alias so it can be edited, renamed, or deleted.',
    example: '!alias unlock shopping',
    params: [
      { name: '<name>', desc: 'The alias to unlock' }
    ]
  },
  {
    name: '!alias delete <name>',
    category: 'security',
    role: 'Everyone',
    shortcuts: ['!del <name>'],
    description: 'Soft-deletes an alias. You retain a 7-day grace period to recover it.',
    example: '!alias delete shopping',
    params: [
      { name: '<name>', desc: 'The alias to delete' }
    ]
  },
  {
    name: '!alias recover <name>',
    category: 'security',
    role: 'Everyone',
    shortcuts: ['!recover <name>'],
    description: 'Recovers an alias deleted within the past 7 days back to active status.',
    example: '!alias recover shopping',
    params: [
      { name: '<name>', desc: 'The alias name to restore' }
    ]
  },
  {
    name: '!inbox',
    category: 'inbox',
    role: 'Everyone',
    shortcuts: ['!inbox view'],
    description: 'Displays the most recent emails received across all your aliases.',
    example: '!inbox'
  },
  {
    name: '!inbox history <name>',
    category: 'inbox',
    role: 'Everyone',
    shortcuts: ['!ih <name>'],
    description: 'Fetches the dedicated email history for a specific alias.',
    example: '!inbox history shopping',
    params: [
      { name: '<name>', desc: 'The alias name to filter history for' }
    ]
  },
  {
    name: '!inbox search <query>',
    category: 'inbox',
    role: 'Everyone',
    shortcuts: ['!is <query>'],
    description: 'Searches through your email subjects and bodies for keywords, OTPs, or senders.',
    example: '!inbox search verification',
    params: [
      { name: '<query>', desc: 'Keywords, sender addresses, or subject words' }
    ]
  },
  {
    name: '!inbox reset',
    category: 'inbox',
    role: 'Everyone',
    shortcuts: ['!reset'],
    description: 'Clears email history in the current server channel.',
    example: '!inbox reset'
  },
  {
    name: '!stats',
    category: 'inbox',
    role: 'Everyone',
    shortcuts: [],
    description: 'Displays your personal alias volume, spam block metrics, and usage limits.',
    example: '!stats'
  },
  {
    name: '/setup',
    category: 'admin',
    role: 'Server Admin',
    shortcuts: [],
    description: 'Deploys the interactive MailCord inbox button and initializes server categories.',
    example: '/setup'
  },
  {
    name: '/admin alias-search <name>',
    category: 'admin',
    role: 'Server Admin',
    shortcuts: [],
    description: 'Lookup ownership and routing details for any alias across the server.',
    example: '/admin alias-search shopping',
    params: [
      { name: '<name>', desc: 'Alias prefix to look up' }
    ]
  },
  {
    name: '/admin user-info <@user>',
    category: 'admin',
    role: 'Server Admin',
    shortcuts: [],
    description: 'Inspect alias counts and limits for a specific server member.',
    example: '/admin user-info @alex',
    params: [
      { name: '<@user>', desc: 'Discord user mention' }
    ]
  },
  {
    name: '/config manager-role <role>',
    category: 'admin',
    role: 'Server Admin',
    shortcuts: [],
    description: 'Configures which Discord role has moderator privileges over MailCord.',
    example: '/config manager-role @MailAdmin',
    params: [
      { name: '<role>', desc: 'Discord role to assign' }
    ]
  },
  // Developer & Diagnostic Commands
  {
    name: '!listc dev',
    category: 'dev',
    role: 'Everyone',
    shortcuts: ['!listc developer'],
    description: 'Displays comprehensive command reference for developer tools, diagnostics, and system telemetry.',
    example: '!listc dev'
  },
  {
    name: '!test <alias>',
    category: 'dev',
    role: 'Everyone',
    shortcuts: ['!diagnostic <alias>'],
    description: 'Executes a live SMTP diagnostic test, DNS resolution verification, and dispatches a test signal email to the alias.',
    example: '!test pulse-cloud-19@bot.devtushar.uk',
    params: [
      { name: '<alias>', desc: 'The full email address or alias prefix to test' }
    ]
  },
  {
    name: '!servers',
    category: 'dev',
    role: 'Developer',
    shortcuts: [],
    description: 'Displays live network telemetry, showing total connected Discord servers and cluster nodes.',
    example: '!servers'
  },
  {
    name: '!users',
    category: 'dev',
    role: 'Developer',
    shortcuts: [],
    description: 'Displays global connected user count across all active server communities.',
    example: '!users'
  },
  {
    name: '!reload',
    category: 'dev',
    role: 'Developer',
    shortcuts: [],
    description: 'Forces a full refresh of application slash commands and flushes local memory caches.',
    example: '!reload'
  },
  {
    name: '!backup',
    category: 'dev',
    role: 'Server Admin',
    shortcuts: [],
    description: 'Generates and downloads a complete JSON backup of the server email routing and permission configuration.',
    example: '!backup'
  },
  {
    name: '!restore',
    category: 'dev',
    role: 'Server Admin',
    shortcuts: [],
    description: 'Restores server routing and permissions from an uploaded config-backup.json file attachment.',
    example: '!restore'
  },
  {
    name: '!redeem <code>',
    category: 'dev',
    role: 'Everyone',
    shortcuts: [],
    description: 'Redeems an enterprise or pro license key to activate premium limits for your account or server.',
    example: '!redeem NEBULA-PRO-2026',
    params: [
      { name: '<code>', desc: 'The alphanumeric license key string' }
    ]
  }
];
