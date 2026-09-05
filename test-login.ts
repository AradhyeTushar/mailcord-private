import { Client, GatewayIntentBits } from 'discord.js';
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once('ready', () => {
  console.log('Ready!');
  process.exit(0);
});
client.login(process.env.DISCORD_BOT_TOKEN).catch(err => {
  console.error('Login failed:', err);
  process.exit(1);
});
