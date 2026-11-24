import { infoPages, renderInfoContent } from '../src/info-pages.js';
import {canonicalHtml} from './site-meta.mjs';
const escapeAttribute = value => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function infoHtml(template, slug = 'index') {
  const title = slug === 'index' ? 'Yardım ve bilgi' : infoPages[slug]?.title;
  if (!title) throw new Error('Bilinmeyen bilgi sayfası');
  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${title} — nfchane</title>`)
    .replace(/<main id="main"[^>]*>[\s\S]*?<\/main>/, () => `<main id="main" class="container info-main">${renderInfoContent(slug)}</main>`);
  if (infoPages[slug]?.guideProduct) {
    html = html.replace(/<meta name="description" content="[^"]*"\s*\/?\s*>/,
      () => `<meta name="description" content="${escapeAttribute(infoPages[slug].intro)}" />`);
  }
  if (slug !== 'index') html = html
    .replaceAll('href="../', 'href="../../')
    .replaceAll('src="../', 'src="../../')
    // Article links point to sibling information pages, rather than the store root.
    .replace('class="info-breadcrumb" aria-label="Sayfa yolu"><a href="../../"', 'class="info-breadcrumb" aria-label="Sayfa yolu"><a href="../"')
    .replace('href="../../iletisim/"', 'href="../iletisim/"');
  return canonicalHtml(html,slug==='index'?'/bilgi/':`/bilgi/${slug}/`);
}
