import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { products, makeSelection, addToCart, restoreCart, contactUrl, sizeLabels } from '../src/shop.js';
import { productPages, productPath, productIdFromPath } from '../src/product-pages.js';
import { productHtml } from '../scripts/product-html.mjs';

test('only clear material can be selected and retired white cart lines are removed', () => {
  let cart = addToCart([], makeSelection('google', { material:'clear', quantity:2 }));
  for (const p of products) assert.throws(()=>makeSelection(p.id,{material:'white'}));
  assert.equal(cart.length,1);
  assert.deepEqual(restoreCart(JSON.stringify(cart)),cart);
  assert.deepEqual(restoreCart(JSON.stringify([...cart,{...cart[0],material:'white'}])),cart);
  for (const bad of ['invalid', 'null', '{}', '[{"productId":"missing"}]', '[{"productId":"google","material":"wood"}]']) assert.deepEqual(restoreCart(bad),[]);
  assert.throws(()=>makeSelection('google',{size:'20x20'}));
  assert.throws(()=>makeSelection('google',{material:'wood'}));
});

test('restoring mixed saved lines preserves valid cards and ignores unavailable options', () => {
  const fixed = makeSelection('google', { quantity: 2 });
  const dynamic = makeSelection('instagram', { linkType: 'dynamic' });
  const saved = [null, fixed, { productId: 'retired' }, { ...fixed, material: 'valueOf' },
    makeSelection('menu', { menuType: 'design-web' }), dynamic];
  assert.deepEqual(restoreCart(JSON.stringify(saved)), [fixed, dynamic]);
});

test('all cards are fixed at 10 cm and retired sizes cannot be ordered', () => {
  assert.deepEqual(sizeLabels,{'10x10':'10 × 10 cm'});
  const cart=addToCart([],makeSelection('iban',{quantity:2}));
  for(const size of ['5x5','12x12','15x15','5x15']) assert.throws(()=>makeSelection('iban',{size}));
  assert.deepEqual(restoreCart(JSON.stringify([...cart,{...cart[0],size:'12x12'}])),cart);
});

test('each static product page is directly addressable, unique and has working nested assets', async () => {
  const template = await readFile(new URL('../index.html',import.meta.url),'utf8');
  assert.equal(new Set(Object.values(productPages).map(p=>p.slug)).size, products.length);
  for (const p of products) {
    const path = productPath(p.id, '/nfcshop/');
    assert.equal(productIdFromPath(path),p.id);
    assert.equal(productIdFromPath(`${path}index.html`),p.id);
    const html = productHtml(template,p.id);
    assert.equal((html.match(/id="product-detail"/g)||[]).length,1);
    assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
    assert.ok(html.includes(`<title>${p.name}`));
    assert.ok(html.includes('src="../../src/main.js"'));
    assert.ok(html.includes('href="#main"'));
    assert.ok(html.includes(p.id === 'google' ? 'href="#product-title"' : 'href="#secim"'));
    assert.doesNotMatch(html, /name="robots"[^>]*noindex/);
    assert.ok(!html.includes('id="hero-title"'));
    const realAssetPath = new URL('../../src/main.js',`https://colves.github.io${path}`).pathname;
    assert.equal(realAssetPath,'/nfcshop/src/main.js');
  }
});

test('WhatsApp handoff encodes the chosen service without transmitting a message', () => {
  const text = 'Menü · Şeffaf pleksi · QR + NFC · 12 adet & tasarım';
  const url = new URL(contactUrl(text));
  assert.equal(url.hostname,'wa.me');
  assert.equal(url.pathname,'/905511956312');
  assert.equal(url.searchParams.get('text'),text);
});
