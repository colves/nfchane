import test from 'node:test';
import assert from 'node:assert/strict';
import {handleApi,tokenHash} from '../worker/index.js';
const env={SUPABASE_URL:'https://test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',ADMIN_LOGIN_EMAIL:'owner@example.invalid',APP_ORIGIN:'https://nfchane.example'};
const request=(path,{method='GET',data,origin=env.APP_ORIGIN,cookie}={})=>new Request(env.APP_ORIGIN+path,{method,headers:{...(method!=='GET'?{Origin:origin}:{}),...(data?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},...(data?{body:JSON.stringify(data)}:{})});
test('real orders and payments remain locked independently of login or flags',async()=>{
  const fail=()=>{throw new Error('Must not contact database');};
  for(const path of ['/api/orders','/api/payments'])assert.equal((await handleApi(request(path,{method:'POST',data:{total:1}}),{...env,CHECKOUT_ENABLED:'true'},fail)).status,423);
});
test('cross-origin mutations and unauthenticated administration are rejected',async()=>{
  const fail=()=>{throw new Error('Must not contact database');};
  assert.equal((await handleApi(request('/api/admin/test-orders',{method:'POST',data:{},origin:'https://attacker.invalid'}),env,fail)).status,403);
  assert.equal((await handleApi(request('/api/admin/products'),env,fail)).status,401);
});
test('forged sessions never reach administrator RPCs',async()=>{
  const calls=[];const fetcher=async url=>{calls.push(url);return new Response('{}',{status:401});};
  const response=await handleApi(request('/api/admin/orders',{cookie:'__Host-nfchane_access=forged'}),env,fetcher);
  assert.equal(response.status,401);assert.equal(calls.length,1);assert.ok(calls[0].endsWith('/auth/v1/user'));
});
test('magic-link flow stores PKCE in secure HttpOnly cookies and does not disclose tokens',async()=>{
  let sent;const fetcher=async(url,options)=>{sent={url,body:JSON.parse(options.body)};return new Response('{}',{status:200});};
  const response=await handleApi(request('/api/auth/start',{method:'POST',data:{email:env.ADMIN_LOGIN_EMAIL}}),env,fetcher);
  assert.equal(response.status,200);assert.equal(sent.body.code_challenge_method,'s256');assert.equal(sent.body.code_challenge.length,43);
  const header=response.headers.get('Set-Cookie');for(const piece of ['HttpOnly','Secure','SameSite=Lax','Path=/','Max-Age=600'])assert.ok(header.includes(piece));
  assert.doesNotMatch(await response.text(),/access_token|refresh_token|code_verifier/);
});
test('unauthorized emails do not send authentication mail and API errors do not leak provider bodies',async()=>{
  let calls=0;const fetcher=async()=>{calls++;return new Response(JSON.stringify({message:'PRIVATE_PROVIDER_DETAIL'}),{status:500});};
  const response=await handleApi(request('/api/auth/start',{method:'POST',data:{email:'other@example.invalid'}}),env,fetcher);assert.equal(response.status,200);assert.equal(calls,0);
  const failure=await handleApi(request('/api/auth/start',{method:'POST',data:{email:env.ADMIN_LOGIN_EMAIL}}),env,fetcher);assert.equal(failure.status,503);assert.ok(!(await failure.text()).includes('PRIVATE_PROVIDER_DETAIL'));
});
test('tracking hashes are fixed-length and not reversible token storage',async()=>{const hash=await tokenHash('a'.repeat(43));assert.match(hash,/^[a-f0-9]{64}$/);assert.notEqual(hash,'a'.repeat(43));});
test('customer sign-up remains closed until transactional email is ready',async()=>{
  const fail=()=>{throw new Error('Disabled customer signup must not contact provider');};
  for(const path of ['/api/customer/signup','/api/customer/login','/api/customer/recovery'])assert.equal((await handleApi(request(path,{method:'POST',data:{email:'test@example.invalid',password:'example-password'}}),env,fail)).status,423);
});
test('verified customer sessions do not receive administrator privileges',async()=>{
  const calls=[];const fetcher=async url=>{calls.push(url);return url.endsWith('/auth/v1/user')?new Response(JSON.stringify({id:'customer-id',email:'test@example.invalid',email_confirmed_at:'2026-01-01'})):new Response(JSON.stringify({code:'42501'}),{status:403});};
  const session=await handleApi(request('/api/customer/session',{cookie:'__Host-nfchane_access=valid'}),env,fetcher);assert.equal(session.status,200);assert.equal((await session.json()).authenticated,true);
  const admin=await handleApi(request('/api/admin/orders',{cookie:'__Host-nfchane_access=valid'}),env,fetcher);assert.equal(admin.status,403);
});
