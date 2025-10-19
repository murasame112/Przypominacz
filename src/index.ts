import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Client, GatewayIntentBits } from 'discord.js';

const TOKEN = process.env.BOT_TOKEN!;
if (!TOKEN) {
  console.error('Brak BOT_TOKEN w .env');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

type CommandModule = {
  data?: { name?: string; toJSON?: () => any };
  execute?: (interaction: any) => Promise<void>;
};

const commands = new Map<string, CommandModule>();

async function loadCommands() {
  const dir = path.resolve('src/commands');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
  for (const f of files) {
    const importPath = `./commands/${f.replace(/\.ts$/, '.js')}`;
    try {
      const mod = (await import(importPath)) as CommandModule;
      const name = mod?.data?.name ?? (mod?.data?.toJSON ? mod.data.toJSON().name : undefined);
      if (name) {
        commands.set(name, mod);
        console.log('Loaded command:', name);
      } else {
        console.warn('Pominięto moduł komendy (brak data.name):', f);
      }
    } catch (err) {
      console.error('Błąd importu komendy', f, err);
    }
  }
}

client.once('ready', async () => {
  console.log(`Zalogowano jako ${client.user?.tag}`);
  await loadCommands();
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const cmd = commands.get(interaction.commandName);
  if (!cmd?.execute) {
    await interaction.reply({ content: 'Komenda niezaimplementowana.', ephemeral: true });
    return;
  }

  try {
    await cmd.execute(interaction);
  } catch (err) {
    console.error('Error executing command:', err);
    if (!interaction.replied) {
      await interaction.reply({ content: 'Wystąpił błąd podczas wykonywania komendy.', ephemeral: true });
    } else {
      await interaction.followUp({ content: 'Wystąpił błąd podczas wykonywania komendy.', ephemeral: true });
    }
  }
});

client.login(TOKEN);
