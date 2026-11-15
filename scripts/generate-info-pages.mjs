import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { infoPages } from '../src/info-pages.js';
import { infoHtml } from './info-html.mjs';

const template = await readFile(new URL('../dist/bilgi/index.html', import.meta.url), 'utf8');
for (const slug of Object.keys(infoPages)) {
  const folder = new URL(`../dist/bilgi/${slug}/`, import.meta.url);
  await mkdir(folder, { recursive: true });
  await writeFile(new URL('index.html', folder), infoHtml(template, slug));
}
console.log('Yardım merkezi ve 7 bağımsız bilgi sayfası hazırlandı.');
