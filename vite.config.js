import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { productIdFromPath } from './src/product-pages.js';
import { productHtml } from './scripts/product-html.mjs';
import { renderHome } from './scripts/render-home.mjs';
import { infoPageFromPath } from './src/info-pages.js';
import { infoHtml } from './scripts/info-html.mjs';
export default defineConfig({
  build: { rollupOptions: { input: {
    main: fileURLToPath(new URL('./index.html', import.meta.url)),
    account: fileURLToPath(new URL('./ornek/iban/index.html', import.meta.url)),
    info: fileURLToPath(new URL('./bilgi/index.html', import.meta.url)),
  } } },
  plugins: [{ name: 'home-html', transformIndexHtml: { order: 'pre', handler: html => html.includes('<!--info-content-->') ? infoHtml(html) : renderHome(html) } }, { name: 'product-pages-dev', configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const pathname = new URL(req.url, 'http://localhost').pathname;
      const infoSlug = infoPageFromPath(pathname);
      if (infoSlug && infoSlug !== 'index') {
        try {
          const template = await readFile(new URL('./bilgi/index.html', import.meta.url), 'utf8');
          const html = await server.transformIndexHtml(pathname, infoHtml(template, infoSlug));
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          return res.end(html);
        } catch (error) { return next(error); }
      }
      const id = productIdFromPath(pathname);
      if (!id) return next();
      try {
        const template = await readFile(new URL('./index.html', import.meta.url), 'utf8');
        const html = await server.transformIndexHtml(pathname, productHtml(template, id));
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(html);
      } catch (error) { next(error); }
    });
  } }],
});
