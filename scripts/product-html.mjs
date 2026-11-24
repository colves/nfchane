import { products } from '../src/shop.js';
import { renderProductPage, productPages } from '../src/product-pages.js';
import {canonicalHtml} from './site-meta.mjs';
const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function productHtml(template, id) {
  const p = products.find(p => p.id === id);
  const extraDescription = id === 'google' ? ' NFC ve QR seçenekleriyle işletmenizin Google yorum sayfasını açın.' :
    id === 'menu' ? ' NFC ve QR ile menü bağlantınızı veya hazır PDF menünüzü paylaşın.' : ' QR ve NFC seçeneklerini inceleyin.';
  return canonicalHtml(template,`/urun/${productPages[id].slug}/`).replace(/\r\n/g, '\n').replace(/<title>[^<]*<\/title>/, () => `<title>${escapeHtml(p.name)} | NFCHane</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/>/, () => `<meta name="description" content="${escapeHtml(p.description)}${extraDescription} Satış henüz açılmadı." />`)
    .replace(/<main id="main">[\s\S]*?<\/main>/, () => `<main id="main">${renderProductPage(id)}</main>`)
    .replace(/<dialog id="product-dialog"[\s\S]*?<\/dialog>/, '')
    .replaceAll('href="#', 'href="../../#')
    .replaceAll('href="../../#secim"', 'href="#secim"')
    .replaceAll('href="../../#product-title"', 'href="#product-title"')
    .replaceAll('href="../../#main"', 'href="#main"')
    .replaceAll('href="./', 'href="../../')
    .replaceAll('src="./', 'src="../../')
    .replace(/[ \t]+\n/g, '\n');
}
export { productPages };
