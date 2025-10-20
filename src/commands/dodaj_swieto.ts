import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { addFavoriteForGuild } from '../dataStore.js';

export const data = new SlashCommandBuilder()
  .setName('dodaj_swieto')
  .setDescription('Dodaje święto do listy serwera')
  .addStringOption(opt => opt.setName('tekst').setDescription('Nazwa święta, np. Dzień Matki').setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Ta komenda działa tylko na serwerze (guild).', flags: MessageFlags.Ephemeral });
    return;
  }
  const tekst = interaction.options.getString('tekst', true).trim();
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    await addFavoriteForGuild(interaction.guildId, tekst);
    await interaction.editReply(`Zapisano "${tekst}" do ulubionych tego serwera, o Wielmożny.`);
  } catch (err) {
    console.error(err);
    await interaction.editReply('Błąd przy zapisywaniu. Spróbuj ponownie później.');
  }
}
