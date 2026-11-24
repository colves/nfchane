import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { infoPages, infoPageFromPath } from '../src/info-pages.js';
import { infoHtml } from '../scripts/info-html.mjs';

const template = await readFile(new URL('../bilgi/index.html', import.meta.url), 'utf8');

test('information routes work at both a domain root and a repository prefix', () => {
  for (const base of ['/', '/nfcshop/']) {
    assert.equal(infoPageFromPath(`${base}bilgi/`), 'index');
    for (const slug of Object.keys(infoPages)) {
      assert.equal(infoPageFromPath(`${base}bilgi/${slug}/`), slug);
      assert.equal(infoPageFromPath(`${base}bilgi/${slug}/index.html`), slug);
    }
    assert.equal(infoPageFromPath(`${base}bilgi/unknown/`), null);
  }
});

test('generated detail navigation remains inside the correct publishing prefix', () => {
  for (const prefix of ['', '/nfcshop']) {
    const url = new URL(`https://preview.example${prefix}/bilgi/teslimat-iade/`);
    const html = infoHtml(template, 'teslimat-iade');
    const links = [...html.matchAll(/href="([^"]*)"/g)].map(match => match[1]);
    const targets = links.map(link => new URL(link, url));
    assert.ok(targets.some(target => target.pathname === `${prefix}/bilgi/`));
    assert.ok(targets.some(target => target.pathname === `${prefix}/bilgi/iletisim/`));
    assert.ok(targets.some(target => target.pathname === `${prefix}/` && target.hash === '#urunler'));
    assert.ok(targets.some(target => target.pathname === url.pathname && target.hash === '#main'));
    assert.ok(targets.some(target => target.pathname === `${prefix}/favicon.svg`));
  }
});

test('legal preparation pages do not request acceptance or collect personal data', () => {
  for (const [slug, page] of Object.entries(infoPages)) {
    const html = infoHtml(template, slug);
    assert.equal((html.match(/<h1>/g) ?? []).length, 1);
    assert.doesNotMatch(html, /<(form|input|iframe)\b/);
    if (page.guideProduct) assert.doesNotMatch(html, /noindex,nofollow/);
    else assert.match(html, /noindex,nofollow/);
    if (page.legal) assert.match(html, /Henüz yürürlükte olan bir metin değil/);
  }
});

test('the contact page offers a user-controlled WhatsApp link rather than sending data', () => {
  const html = infoHtml(template, 'iletisim');
  assert.match(html, /href="https:\/\/wa\.me\/905511956312"/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.doesNotMatch(html, /wa\.me\/905511956312\?text=/);
});
