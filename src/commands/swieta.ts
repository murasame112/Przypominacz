import { SlashCommandBuilder } from 'discord.js';
import { getFirstArticleAnchors } from '../scrape-cheerio.js';
import { chunkString } from '../libs/utils.js';

export const data = new SlashCommandBuilder()
  .setName('swieta')
  .setDescription('Zwraca nietypowe święta na dziś');

export async function execute(interaction: any) {
  const url = 'https://www.kalbi.pl/kalendarz-swiat-nietypowych';
  await interaction.deferReply();

  try {
    const { texts } = await getFirstArticleAnchors(url);
    if (!texts || texts.length === 0) {
      await interaction.editReply('Nie znaleziono świąt.');
      return;
    }

    const joined = texts.join('\n');
    if (joined.length <= 1900) {
      await interaction.editReply(joined);
      return;
    }

    const parts = chunkString(joined, 1900);
    await interaction.editReply(parts.shift()!);
    for (const p of parts) await interaction.followUp(p);
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : String(e);
    await interaction.editReply(`Błąd podczas scrapowania: ${msg}`);
  }
}
