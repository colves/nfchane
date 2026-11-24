import { readFile, writeFile } from 'node:fs/promises';
import { indexablePaths, primaryOrigin } from './site-meta.mjs';

const dist = new URL('../dist/', import.meta.url);
for (const path of indexablePaths) {
  const html = await readFile(new URL(`.${path}index.html`, dist), 'utf8');
  if (!html.includes(`rel="canonical" href="${primaryOrigin}${path}"`) || /name="robots"[^>]*noindex/i.test(html)) {
    throw new Error(`Invalid indexable page: ${path}`);
  }
}

const entries = indexablePaths.map(path => `  <url><loc>${primaryOrigin}${path}</loc></url>`).join('\n');
await writeFile(new URL('sitemap.xml', dist), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`);
await writeFile(new URL('robots.txt', dist), `User-agent: *\nAllow: /\n\nSitemap: ${primaryOrigin}/sitemap.xml\n`);
