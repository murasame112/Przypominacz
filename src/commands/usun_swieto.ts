import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { removeFavoriteForGuild } from '../dataStore.js';

export const data = new SlashCommandBuilder()
  .setName('usun_swieto')
  .setDescription('Usuwa święto z listy serwera')
  .addStringOption(opt => opt.setName('tekst').setDescription('Nazwa święta do usunięcia').setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Ta komenda działa tylko na serwerze (guild).', flags: MessageFlags.Ephemeral });
    return;
  }
  const tekst = interaction.options.getString('tekst', true).trim();
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    const ok = await removeFavoriteForGuild(interaction.guildId, tekst);
    if (ok) {
      await interaction.editReply(`Usunięto "${tekst}" z listy serwera.`);
    } else {
      await interaction.editReply(`Nie znalazłem "${tekst}" na liście serwera.`);
    }
  } catch (err) {
    console.error(err);
    await interaction.editReply('Błąd przy usuwaniu. Spróbuj później.');
  }
}
