import { productPages } from '../src/product-pages.js';
import { infoPages } from '../src/info-pages.js';

export const primaryOrigin='https://nfchane.com';
export const indexablePaths = [
  '/',
  ...Object.values(productPages).map(({ slug }) => `/urun/${slug}/`),
  ...Object.entries(infoPages).filter(([, page]) => page.guideProduct).map(([slug]) => `/bilgi/${slug}/`),
];
export function canonicalHtml(html,path='/') {
  const pathname=new URL(path,primaryOrigin).pathname.replace(/index\.html$/,'');
  const href=primaryOrigin+pathname;
  const indexedHtml = indexablePaths.includes(pathname) ? html.replace(/^\s*<meta name="robots" content="noindex,nofollow"\s*\/>\r?\n/m, '') : html;
  return indexedHtml.replace(/\s*<link\s+rel="canonical"[^>]*>/g,'').replace('</head>',`    <link rel="canonical" href="${href}" />\n  </head>`);
}
