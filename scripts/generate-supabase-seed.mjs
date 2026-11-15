import { writeFile } from 'node:fs/promises';
import { products } from '../src/shop.js';
import { productPages } from '../src/product-pages.js';
import { googleCardAsset } from '../src/google-card-assets.js';
import { instagramCardAsset } from '../src/instagram-card-assets.js';
import { whatsappCardAsset } from '../src/whatsapp-card-assets.js';
import { menuCardAsset } from '../src/menu-card-assets.js';
import { websiteCardAsset } from '../src/website-card-assets.js';
import { ibanCardAsset } from '../src/iban-card-assets.js';
import { listingCardAsset } from '../src/listing-card-assets.js';
const assets = {google:googleCardAsset,instagram:instagramCardAsset,whatsapp:whatsappCardAsset,menu:menuCardAsset,web:websiteCardAsset,iban:ibanCardAsset,ilan:listingCardAsset};
const quote = value => `'${String(value).replaceAll("'", "''")}'`;
const rows = products.map((p, index) => {
  const variants = Object.fromEntries(['hybrid','nfc','qr'].map(method => [method, assets[p.id](method,'clear','')]));
  return `(${[p.id,productPages[p.id].slug,p.name,p.description,p.category,p.label,p.headline,p.subtitle,p.tone,p.symbol,variants.hybrid,JSON.stringify(variants)].map(quote).join(',')},${index},${p.id === 'menu' ? "array['link','pdf','design-pdf','design-web']" : 'array[]::text[]'})`;
});
const sql = `-- Public preview catalog. No invented prices. Reruns preserve existing product edits.\nbegin;\ninsert into public.products (id,slug,name,description,category,label,headline,subtitle,tone,symbol,image_path,image_variants,sort_order,menu_services) values\n${rows.join(',\n')}\non conflict (id) do nothing;\ncommit;\n`;
await writeFile(new URL('../supabase/seed.sql',import.meta.url),sql);
console.log('7 public preview products prepared; existing rows will not be overwritten.');
