import { load } from 'cheerio';
import { fetch } from 'undici';

export async function getFirstArticleAnchors(url: string) {
  const res = await fetch(url, { headers: { 'User-Agent': 'MuraBot/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  const $ = load(html);
  const firstArticle = $('article').first();
  const anchors = firstArticle.find('header h3 a').toArray();

  const texts = anchors.map(a => $(a).text().trim()).filter(Boolean);

  return { texts };
}