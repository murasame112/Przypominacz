import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

const TOKEN = process.env.BOT_TOKEN!;
const CLIENT_ID = process.env.CLIENT_ID!;
const GUILD_ID = process.env.GUILD_ID!;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('Brak BOT_TOKEN, CLIENT_ID lub GUILD_ID w .env');
  process.exit(1);
}

const commandsDir = path.resolve('src/commands');
const files = fs.readdirSync(commandsDir).filter(f => f.endsWith('.ts') || f.endsWith('.js'));

const commands: any[] = [];

for (const file of files) {
  const importPath = `../src/commands/${file}`.replace(/\.ts$/, '.js').replace(/\\/g, '/');
  try {
    const mod = await import(importPath);
    if (mod?.data) {
      commands.push(mod.data.toJSON ? mod.data.toJSON() : mod.data);
      console.log('Prepared command for deploy:', mod.data.name ?? mod.data.toJSON?.().name);
    }
  } catch (err) {
    console.error('Błąd importu przy deploy:', file, err);
  }
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Rejestracja komend do guildy...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('Komendy zarejestrowane.');
  } catch (err) {
    console.error('Błąd rejestracji komend:', err);
  }
})();
