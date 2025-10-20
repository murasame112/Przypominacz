import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Client, GatewayIntentBits } from 'discord.js';
import { fileURLToPath } from 'url';

const TOKEN = process.env.BOT_TOKEN!;
if (!TOKEN) {
  console.error('Brak BOT_TOKEN w .env');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

type CommandModule = {
  data?: { name?: string; toJSON?: () => any };
  execute?: (interaction: any) => Promise<void>;
};

const commands = new Map<string, CommandModule>();

async function loadCommands() {
  const possibleDirs = [
    path.join(__dirname, 'commands'),
    path.resolve('src/commands'),
    path.join(process.cwd(), 'commands'),
  ];

  let commandsDir: string | null = null;
  for (const d of possibleDirs) {
    if (fs.existsSync(d) && fs.statSync(d).isDirectory()) {
      commandsDir = d;
      break;
    }
  }

  if (!commandsDir) {
    console.warn('loadCommands: nie znaleziono katalogu komend. Sprawdź:', possibleDirs);
    return;
  }

  const useJs = commandsDir.includes(`${path.sep}dist${path.sep}`) || commandsDir.endsWith(`${path.sep}commands`);
  const exts = useJs ? ['.js'] : ['.ts', '.js'];

  const files = fs.readdirSync(commandsDir).filter(f => exts.some(e => f.endsWith(e)));

  for (const f of files) {
    if (f.endsWith('.d.ts') || f.endsWith('.js.map')) continue;

    const fullPath = path.join(commandsDir, f);
    let importPath = path.relative(__dirname, fullPath).replace(/\\/g, '/');
    if (!importPath.startsWith('.')) importPath = `./${importPath}`;

    try {
      const mod = (await import(importPath)) as CommandModule;
      const name = mod?.data?.name ?? (mod?.data?.toJSON ? mod.data.toJSON().name : undefined);
      if (name) {
        commands.set(name, mod);
        console.log('Loaded command:', name);
      } else {
        console.warn('Pominięto moduł (brak data.name):', f);
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
