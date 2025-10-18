import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import type { Interaction } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { SlashCommandBuilder } from 'discord.js';

const TOKEN = process.env.BOT_TOKEN!;
const CLIENT_ID = process.env.CLIENT_ID!;
const GUILD_ID = process.env.GUILD_ID!;

// 1) Zdefiniuj komendy (tu tylko /ping)
const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!').toJSON(),
];

// 2) Zarejestruj komendy do konkretnego serwera (szybkie podczas dev)
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Rejestracja komend do guildy...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands },
    );
    console.log('Komendy zarejestrowane.');
  } catch (error) {
    console.error('Błąd rejestracji komend:', error);
  }
})();

// 3) Stwórz klienta
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log(`Zalogowano jako ${client.user?.tag}`);
});

// 4) Obsługa interakcji (slash command)
client.on('interactionCreate', async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
  }
});

client.login(TOKEN);
