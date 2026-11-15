import { writeFile } from 'node:fs/promises';
import { loadEnv } from 'vite';
import { validateCatalogRows } from '../src/catalog-bridge.js';

const env = {...loadEnv('production',process.cwd(),'SUPABASE_'),...process.env};
const url = env.SUPABASE_URL;
const key = env.SUPABASE_PUBLISHABLE_KEY;
const target = new URL('../src/catalog-snapshot.json',import.meta.url);
if (!url && !key) {
  await writeFile(target,'[]\n');
  console.log('Supabase is not configured: bundled preview catalog retained.');
} else {
  // Intentionally reject secret/service-role keys. Only a read-only public key is used.
  if (!url || !key?.startsWith('sb_publishable_') || !/^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url)) throw new Error('Expected a Supabase HTTPS URL and publishable key; never use a secret key here.');
  const fields = 'id,name,description,label,headline,subtitle,price_minor,currency,is_purchasable';
  const response = await fetch(`${url.replace(/\/$/,'')}/rest/v1/products?select=${fields}&order=sort_order`,{headers:{apikey:key},signal:AbortSignal.timeout(10000)});
  // Never log response bodies or credentials on failure.
  if (!response.ok) throw new Error(`Public catalog request failed (${response.status}). Existing deployment remains unchanged.`);
  const rows = validateCatalogRows(await response.json(),['google','instagram','whatsapp','menu','web','iban','ilan']);
  await writeFile(target,`${JSON.stringify(rows,null,2)}\n`);
  console.log(`Supabase connected: ${rows.length} public preview products synchronized. Sales remain disabled.`);
}
