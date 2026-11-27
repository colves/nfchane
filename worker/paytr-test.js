import {authenticatePaytrNotification, matchPaytrNotification} from './paytr-notification.js';

const encoder = new TextEncoder();
const base64 = bytes => btoa(String.fromCharCode(...bytes));
const referencePattern = /^NFCT[0-9a-f]{32}$/;
const tokenPattern = /^[A-Za-z0-9._~-]{8,256}$/;
const amountMinor = 1000;
const frameLifetime = 30 * 60 * 1000;
const retention = 30 * 24 * 60 * 60 * 1000;

export const paytrTestReady = env => Boolean(env.PAYTR_TEST_ATTEMPTS && /^\d+$/.test(env.PAYTR_MERCHANT_ID || '')
  && env.PAYTR_MERCHANT_KEY && env.PAYTR_MERCHANT_SALT && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.PAYTR_TEST_BUYER_EMAIL || '')
  && env.APP_ORIGIN === 'https://nfchane.com');

export class PaytrTestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const keys = env => ({key:env.PAYTR_MERCHANT_KEY,salt:env.PAYTR_MERCHANT_SALT});

export async function paytrTestToken(attempt, env, ip, fetcher) {
  const returnUrl = env.APP_ORIGIN + '/api/paytr/test/return';
  const form = new URLSearchParams({
    merchant_id:env.PAYTR_MERCHANT_ID,user_ip:ip,merchant_oid:attempt.reference,email:env.PAYTR_TEST_BUYER_EMAIL,
    payment_amount:String(attempt.amountMinor),
    user_basket:base64(encoder.encode(JSON.stringify([['NFCHane test kartı',(attempt.amountMinor / 100).toFixed(2),1]]))),
    no_installment:'1',max_installment:'0',currency:'TL',test_mode:'1',debug_on:'0',lang:'tr',
    user_name:'NFCHane Test Misafir',user_address:'NFCHane test adresi, Sakarya, Türkiye',user_phone:'05000000000',
    merchant_ok_url:returnUrl,merchant_fail_url:returnUrl,timeout_limit:'30',
  });
  const signedFields = ['merchant_id','user_ip','merchant_oid','email','payment_amount','user_basket',
    'no_installment','max_installment','currency','test_mode'];
  const message = signedFields.map(key => form.get(key)).join('') + env.PAYTR_MERCHANT_SALT;
  const hmac = await crypto.subtle.importKey('raw',encoder.encode(env.PAYTR_MERCHANT_KEY),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  form.set('paytr_token',base64(new Uint8Array(await crypto.subtle.sign('HMAC',hmac,encoder.encode(message)))));

  let response;
  try {
    response = await fetcher('https://www.paytr.com/odeme/api/get-token',{
      method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Accept:'application/json'},
      body:form.toString(),redirect:'manual',signal:AbortSignal.timeout(12000),
    });
  } catch {
    throw new PaytrTestError(502,'Worker, PayTR test servisine bağlantı kuramadı.');
  }
  if (!response.ok) {
    throw new PaytrTestError(502,`PayTR test servisi HTTP ${response.status} döndürdü.`);
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw new PaytrTestError(502,'PayTR test servisi JSON yerine beklenmeyen bir yanıt döndürdü.');
  }
  if (result?.status !== 'success' || typeof result.token !== 'string' || !tokenPattern.test(result.token)) {
    throw new PaytrTestError(502,'PayTR test ekranı açılamadı. Mağaza panelindeki entegrasyon ayarlarını kontrol edin.');
  }
  return result.token;
}

async function attemptRequest(env, reference, action, data) {
  const stub = env.PAYTR_TEST_ATTEMPTS.get(env.PAYTR_TEST_ATTEMPTS.idFromName(reference));
  const response = await stub.fetch('https://private.invalid/'+action,{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),
  });
  return response.json();
}

function view(attempt) {
  if (!attempt) throw new PaytrTestError(404,'Test işlemi bulunamadı.');
  const {reference,totalMinor,status,frameToken,createdAt} = attempt;
  const expired = ['creating','pending'].includes(status) && Date.now() - createdAt >= frameLifetime;
  return {reference,amountMinor:totalMinor,status:expired?'expired':status,
    iframeUrl:!expired && status === 'pending' ? 'https://www.paytr.com/odeme/guvenli/'+encodeURIComponent(frameToken) : null};
}

export async function startPaytrTest(env, {requestKey,owner,ip}, fetcher) {
  if (!/^[0-9a-f-]{36}$/.test(requestKey)) throw new PaytrTestError(400,'Geçersiz test kimliği.');
  if (!ip) throw new PaytrTestError(400,'Test bağlantısı adresi doğrulanamadı.');
  const reference = 'NFCT'+requestKey.replaceAll('-','');
  const {created,attempt} = await attemptRequest(env,reference,'reserve',{reference,owner});
  if (!created) return view(attempt);
  try {
    const token = await paytrTestToken({reference,amountMinor:attempt.totalMinor},env,ip,fetcher);
    const updated = await attemptRequest(env,reference,'open',{owner,token});
    return view(updated.attempt);
  } catch (error) {
    await attemptRequest(env,reference,'unavailable',{owner});
    if (error instanceof PaytrTestError) throw error;
    throw new PaytrTestError(502,'PayTR test servisine ulaşılamadı. Test oturumunun imzalanması veya kaydedilmesi tamamlanamadı.');
  }
}

export async function getPaytrTest(env, reference, owner) {
  if (!referencePattern.test(reference)) throw new PaytrTestError(404,'Test işlemi bulunamadı.');
  return view((await attemptRequest(env,reference,'status',{owner})).attempt);
}

async function readNotification(request) {
  if (request.headers.get('Content-Type')?.split(';')[0].toLowerCase() !== 'application/x-www-form-urlencoded' || !request.body) return null;
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let payload = '';
  while (true) {
    const {value,done} = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 8192) { await reader.cancel(); return null; }
    payload += decoder.decode(value,{stream:true});
  }
  const params = new URLSearchParams(payload + decoder.decode());
  if (new Set(params.keys()).size !== params.size) return null;
  return Object.fromEntries(params);
}

export async function acceptPaytrTestNotification(request, env) {
  const fields = await readNotification(request);
  if (!fields || !referencePattern.test(fields.merchant_oid)
      || !await authenticatePaytrNotification(fields,keys(env))) return false;
  return (await attemptRequest(env,fields.merchant_oid,'notification',{fields})).accepted;
}

// Each object owns exactly one test reference. There is no link to fulfilment, sales or customer data.
export class PaytrTestAttempt {
  constructor(ctx) { this.ctx = ctx; }

  async fetch(request) {
    const action = new URL(request.url).pathname.slice(1);
    const data = await request.json();
    return this.ctx.blockConcurrencyWhile(async () => {
      const storage = this.ctx.storage;
      let attempt = await storage.get('attempt');
      if (action === 'notification') {
        if (!attempt) return Response.json({accepted:false});
        const result = matchPaytrNotification(data.fields,{reference:attempt.reference,amountMinor:attempt.totalMinor,
          currency:'TRY',installments:false,test:true});
        if (!result) return Response.json({accepted:false});
        if (['success','failed'].includes(attempt.status)) return Response.json({accepted:attempt.status===result.status});
        if (attempt.status !== 'pending') return Response.json({accepted:false});
        await storage.put('attempt',{...attempt,frameToken:null,status:result.status,verifiedAt:Date.now()});
        return Response.json({accepted:true});
      }
      if (attempt && attempt.owner !== data.owner) return Response.json({attempt:null});
      if (action === 'reserve' && !attempt) {
        attempt = {reference:data.reference,owner:data.owner,totalMinor:amountMinor,status:'creating',createdAt:Date.now()};
        await storage.setAlarm(attempt.createdAt + retention);
        await storage.put('attempt',attempt);
        return Response.json({created:true,attempt});
      }
      if (attempt?.status === 'creating' && ['open','unavailable'].includes(action)) {
        attempt = {...attempt,status:action === 'open'?'pending':'unavailable',frameToken:data.token ?? null};
        await storage.put('attempt',attempt);
      }
      return Response.json({attempt:attempt ?? null});
    });
  }

  async alarm() { await this.ctx.storage.deleteAll(); }
}
