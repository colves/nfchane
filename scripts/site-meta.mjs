export const primaryOrigin='https://nfchane.com';
export function canonicalHtml(html,path='/') {
  const pathname=new URL(path,primaryOrigin).pathname.replace(/index\.html$/,'');
  const href=primaryOrigin+pathname;
  return html.replace(/\s*<link\s+rel="canonical"[^>]*>/g,'').replace('</head>',`    <link rel="canonical" href="${href}" />\n  </head>`);
}
