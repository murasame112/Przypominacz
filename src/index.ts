import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import type { Interaction } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { SlashCommandBuilder } from 'discord.js';
import { getFirstArticleAnchors } from './scrape-cheerio.js';

const TOKEN = process.env.BOT_TOKEN!;
const CLIENT_ID = process.env.CLIENT_ID!;
const GUILD_ID = process.env.GUILD_ID!;

// 1) Zdefiniuj komendy (tu tylko /ping)
const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong!').toJSON(),
	  new SlashCommandBuilder()
    .setName('święta')
    .setDescription('Zwraca nietypowe święta na dziś')
    .toJSON(),
];

// 2) Zarejestruj komendy do konkretnego serwera (szybkie podczas dev)
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
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
function chunkString(str: string, size = 1900): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < str.length) {
    chunks.push(str.slice(i, i + size));
    i += size;
  }
  return chunks;
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
    return;
  }

  if (interaction.commandName === 'święta') {
    // pobierz url z opcji albo użyj domyślnego
    const url = interaction.options.getString('url') ?? 'https://www.kalbi.pl/kalendarz-swiat-nietypowych';

    // defer bo scrap może chwilę trwać
    await interaction.deferReply();

    try {
      const { texts } = await getFirstArticleAnchors(url);

      if (!texts || texts.length === 0) {
        await interaction.editReply('Nie znaleziono świąt.');
        return;
      }

      const joined = texts.join('\n');
      // jeśli za długie - podziel na kawałki (Discord max ~2000 znaków)
      const parts = chunkString(joined, 1900);

      // wyślij pierwszy kawałek jako edycję odpowiedzi (editReply), resztę jako followUp
      await interaction.editReply(parts.shift()!);
      for (const part of parts) {
        await interaction.followUp(part);
      }
    } catch (err) {
      console.error('Scrape error:', err);
      const message = err instanceof Error ? err.message : String(err);
      await interaction.editReply(`Błąd podczas scrapowania: ${message}`);
    }
  }
});

client.login(process.env.BOT_TOKEN);

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
