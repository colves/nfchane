import test from 'node:test';
import assert from 'node:assert/strict';
import worker, {handleApi} from '../worker/index.js';
import {canonicalHtml} from '../scripts/site-meta.mjs';
import {productHtml} from '../scripts/product-html.mjs';
import {products} from '../src/shop.js';
import {readFile} from 'node:fs/promises';

test('legacy browsing redirects to the same public path and keeps active sessions on their host', async () => {
  const env = {
    APP_ORIGIN: 'https://nfchane.com',
    LEGACY_APP_ORIGIN: 'https://nfchane.colves.workers.dev',
    ASSETS: {fetch: () => new Response('asset')},
  };
  for (const path of ['/', '/urun/google-yorum-karti/?a=1&b=2', '/yonetim/']) {
    const response = await worker.fetch(new Request(env.LEGACY_APP_ORIGIN + path), env);
    assert.equal(response.status, 308);
    assert.equal(response.headers.get('Location'), env.APP_ORIGIN + path);
  }
  const legacySession = new Request(env.LEGACY_APP_ORIGIN + '/yonetim/', {
    headers: {Cookie: '__Host-nfchane_refresh=test-session'},
  });
  assert.equal(await (await worker.fetch(legacySession, env)).text(), 'asset');
  assert.equal(await (await worker.fetch(new Request(env.APP_ORIGIN + '/'), env)).text(), 'asset');
  const callback = await worker.fetch(new Request(env.LEGACY_APP_ORIGIN + '/api/auth/callback'), env);
  assert.equal(callback.status, 303);
  assert.equal(callback.headers.get('Location'), env.LEGACY_APP_ORIGIN + '/yonetim/#giris-hatasi');
});

test('canonical addresses use the primary domain and exclude query parameters',()=>{
  const html=canonicalHtml('<head><link rel="canonical" href="https://old.invalid/"></head>','/urun/google-yorum-karti/index.html?ref=qr');
  assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
  assert.ok(html.includes('https://nfchane.com/urun/google-yorum-karti/'));
  assert.ok(!html.includes('old.invalid'));
});
test('logo links return to a clean root while section links remain anchors',async()=>{
  const template=await readFile(new URL('../index.html',import.meta.url),'utf8');
  assert.ok(!template.includes('href="#"'));
  assert.ok(template.includes('class="logo" href="./"'));
  const product=productHtml(template,'google');
  assert.ok(product.includes('class="logo" href="../../"'));
  assert.ok(product.includes('href="../../#urunler"'));
});
test('admin mail throttling shares a privacy-preserving key across both hosts',async()=>{
  const keys=[];const env={SUPABASE_URL:'https://test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',ADMIN_LOGIN_EMAIL:'owner@example.invalid',APP_ORIGIN:'https://nfchane.com',LEGACY_APP_ORIGIN:'https://nfchane.colves.workers.dev',ADMIN_LOGIN_LIMITER:{async limit({key}){keys.push(key);return {success:false};}}};
  for(const origin of [env.APP_ORIGIN,env.LEGACY_APP_ORIGIN]){
    const request=new Request(origin+'/api/auth/start',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email:env.ADMIN_LOGIN_EMAIL})});
    assert.equal((await handleApi(request,env,()=>{throw Error('Throttled requests must not send mail');})).status,429);
  }
  assert.equal(keys[0],keys[1]);assert.ok(!keys[0].includes(env.ADMIN_LOGIN_EMAIL));
});
test('product metadata escapes text and attributes without interpreting replacement tokens',()=>{
  const p=products.find(item=>item.id==='google'),old={name:p.name,description:p.description};
  try {
    p.name='Test </title><script>bad()</script> $&';p.description='A "quoted" & <tag> $&';
    const html=productHtml('<head><title>Old</title><meta name="description" content="old" /></head><main id="main"></main>','google');
    assert.match(html,/<title>Test &lt;\/title&gt;&lt;script&gt;bad\(\)&lt;\/script&gt; \$&amp;/);
    assert.ok(html.includes('content="A &quot;quoted&quot; &amp; &lt;tag&gt; $&amp;'));
  }finally{Object.assign(p,old);}
});
test('primary and legacy authentication keep PKCE callbacks on their originating host',async()=>{
  const env={SUPABASE_URL:'https://test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',ADMIN_LOGIN_EMAIL:'owner@example.invalid',APP_ORIGIN:'https://nfchane.com',LEGACY_APP_ORIGIN:'https://nfchane.colves.workers.dev'};
  for(const origin of [env.APP_ORIGIN,env.LEGACY_APP_ORIGIN]){
    let sent='';
    const req=new Request(origin+'/api/auth/start',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email:env.ADMIN_LOGIN_EMAIL})});
    const response=await handleApi(req,env,async url=>{sent=url;return new Response('{}');});
    assert.equal(response.status,200);
    assert.equal(new URL(sent).searchParams.get('redirect_to'),origin+'/api/auth/callback');
    const callback=await handleApi(new Request(origin+'/api/auth/callback'),env);
    assert.equal(callback.headers.get('Location'),origin+'/yonetim/#giris-hatasi');
  }
  const bad=new Request(env.APP_ORIGIN+'/api/auth/start',{method:'POST',headers:{Origin:env.LEGACY_APP_ORIGIN,'Content-Type':'application/json'},body:'{}'});
  assert.equal((await handleApi(bad,env)).status,403);
});
