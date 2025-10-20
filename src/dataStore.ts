import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.resolve('data');
const FILE = path.join(DATA_DIR, 'favorites-guilds.json');

type FavMap = Record<string, string[]>;

async function ensureFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(FILE);
  } catch {
    await fs.writeFile(FILE, JSON.stringify({} as FavMap, null, 2), 'utf8');
  }
}

async function readAll(): Promise<FavMap> {
  await ensureFile();
  const txt = await fs.readFile(FILE, 'utf8');
  return JSON.parse(txt || '{}') as FavMap;
}

async function writeAll(data: FavMap) {
  await ensureFile();
  await fs.writeFile(FILE, JSON.stringify(data, null, 2), 'utf8');
}

export async function listFavoritesForGuild(guildId: string): Promise<string[]> {
  const all = await readAll();
  return all[guildId] ?? [];
}

export async function addFavoriteForGuild(guildId: string, term: string): Promise<void> {
  const normalized = term.trim();
  if (!normalized) return;
  const all = await readAll();
  const cur = all[guildId] ?? [];
  if (!cur.some(t => t.toLowerCase() === normalized.toLowerCase())) {
    cur.push(normalized);
    all[guildId] = cur;
    await writeAll(all);
  }
}

export async function removeFavoriteForGuild(guildId: string, term: string): Promise<boolean> {
  const normalized = term.trim();
  if (!normalized) return false;
  const all = await readAll();
  const cur = all[guildId] ?? [];
  const idx = cur.findIndex(t => t.toLowerCase() === normalized.toLowerCase());
  if (idx === -1) return false;
  cur.splice(idx, 1);
  all[guildId] = cur;
  await writeAll(all);
  return true;
}
