import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { listFavoritesForGuild } from '../dataStore.js';
import { getFirstArticleAnchors } from '../scrape-cheerio.js';

export const data = new SlashCommandBuilder()
  .setName('dzisiaj')
  .setDescription('Pokazuje dziś tylko te święta z listy tego serwera');

function matchesAny(text: string, favorites: string[]): boolean {
  const low = text.toLowerCase();
  return favorites.some(f => low.includes(f.toLowerCase()));
}

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Ta komenda działa tylko na serwerze (guild).', flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.deferReply();

  try {
    const favorites = await listFavoritesForGuild(interaction.guildId);
    if (!favorites || favorites.length === 0) {
      await interaction.editReply('Lista ulubionych tego serwera jest pusta. Dodaj coś komendą /dodaj_swieto.');
      return;
    }

    const url = 'https://www.kalbi.pl/kalendarz-swiat-nietypowych';
    const { texts } = await getFirstArticleAnchors(url);

    if (!texts || texts.length === 0) {
      await interaction.editReply('Nie znaleziono dzisiaj żadnych świąt na stronie.');
      return;
    }

    const filtered = texts.filter(t => matchesAny(t, favorites));
    if (filtered.length === 0) {
      await interaction.editReply('Dziś nie ma żadnego święta pasującego do listy serwera.');
      return;
    }

    const joined = filtered.join('\n');
    const chunkSize = 1900;
    const parts: string[] = [];
    for (let i = 0; i < joined.length; i += chunkSize) parts.push(joined.slice(i, i + chunkSize));

    await interaction.editReply(parts.shift()!);
    for (const p of parts) await interaction.followUp(p);
  } catch (err) {
    console.error(err);
    await interaction.editReply('Błąd podczas pobierania/filtracji świąt.');
  }
}
