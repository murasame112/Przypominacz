import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { listFavoritesForGuild } from '../dataStore.js';

export const data = new SlashCommandBuilder()
  .setName('lista_swiat')
  .setDescription('Wyświetla święta zapisane dla tego serwera');

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'Ta komenda działa tylko na serwerze (guild).', flags: MessageFlags.Ephemeral });
    return;
  }
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    const list = await listFavoritesForGuild(interaction.guildId);
    if (!list || list.length === 0) {
      await interaction.editReply('Ten serwer nie ma zapisanych żadnych świąt. Dodaj je komendą /dodaj_swieto.');
      return;
    }
    const text = list.map((t, i) => `${i + 1}. ${t}`).join('\n');
    await interaction.editReply(`Lista świąt tego serwera:\n${text}`);
  } catch (err) {
    console.error(err);
    await interaction.editReply('Błąd — spróbuj ponownie.');
  }
}
