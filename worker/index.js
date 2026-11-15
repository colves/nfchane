import { InputError,email,text,uuid,validateOrder,validateProduct,validateFulfilment,statuses } from './validation.js';

const names={access:'__Host-nfchane_access',refresh:'__Host-nfchane_refresh',verifier:'__Host-nfchane_pkce',flow:'__Host-nfchane_flow',next:'__Host-nfchane_next'};
const encoder=new TextEncoder();
const security={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY'};
class ApiError extends Error { constructor(status,message){super(message);this.status=status;} }
const json=(body,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8',...security,...headers}});
const b64=bytes=>btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
export const randomToken=()=>b64(crypto.getRandomValues(new Uint8Array(32)));
export async function tokenHash(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
const cookie=(name,value,age)=>`${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
function cookies(request){return Object.fromEntries((request.headers.get('Cookie')||'').split(';').map(v=>v.trim().split(/=(.*)/s).slice(0,2)).filter(v=>v.length===2).map(([k,v])=>[k,decodeURIComponent(v)]));}
function sessionCookies(response,data){response.headers.append('Set-Cookie',cookie(names.access,data.access_token,Math.min(data.expires_in||3600,3600)));response.headers.append('Set-Cookie',cookie(names.refresh,data.refresh_token,604800));}
function clearCookies(response){for(const name of Object.values(names))response.headers.append('Set-Cookie',cookie(name,'',0));return response;}
function configured(env){return /^https:\/\/[a-z0-9]+\.supabase\.co$/.test(env.SUPABASE_URL||'')&&env.SUPABASE_PUBLISHABLE_KEY?.startsWith('sb_publishable_')&&env.ADMIN_LOGIN_EMAIL;}
async function body(request){
  if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))throw new ApiError(415,'JSON biçiminde istek gerekli.');
  if(Number(request.headers.get('Content-Length')||0)>48000)throw new ApiError(413,'İstek çok büyük.');
  if(!request.body)throw new ApiError(400,'İstek bilgileri eksik.');
  const reader=request.body.getReader();let length=0;const parts=[];
  while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>48000){await reader.cancel();throw new ApiError(413,'İstek çok büyük.');}parts.push(value);}
  const joined=new Uint8Array(length);let offset=0;for(const part of parts){joined.set(part,offset);offset+=part.length;}
  try{return JSON.parse(new TextDecoder().decode(joined));}catch{throw new ApiError(400,'İstek bilgileri okunamadı.');}
}
async function upstream(env,path,{token,method='GET',data}={},fetcher=fetch){
  const response=await fetcher(`${env.SUPABASE_URL}${path}`,{method,headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,...(token?{Authorization:`Bearer ${token}`} : {}),...(data?{'Content-Type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{}),signal:AbortSignal.timeout(12000)});
  let result;try{result=await response.json();}catch{result=null;}
  if(!response.ok){
    const code=result?.code||result?.error_code;
    if(code==='invalid_credentials')throw new ApiError(401,'E-posta veya parola hatalı.');
    if(code==='email_not_confirmed')throw new ApiError(403,'Önce e-posta adresinizi doğrulayın.');
    if(response.status===401||code==='bad_jwt')throw new ApiError(401,'Oturum süresi doldu. Yeniden giriş yapın.');
    if(response.status===429)throw new ApiError(429,'Çok sık deneme yapıldı. Bir süre sonra tekrar deneyin.');
    if(code==='42501'||response.status===403)throw new ApiError(403,'Bu işlem için yönetici yetkisi gerekli.');
    if(code==='P0002')throw new ApiError(404,'Kayıt bulunamadı.');
    if(code==='23505')throw new ApiError(409,'Bu işlem kimliği daha önce farklı bilgilerle kullanıldı.');
    if(['22023','23514','22P02','22003'].includes(code))throw new ApiError(400,'Bilgiler veritabanı kurallarına uymuyor. Alanları kontrol edin.');
    throw new ApiError(503,'Hizmete şu anda ulaşılamıyor. Daha sonra tekrar deneyin.');
  }
  return result;
}
const rpc=(env,token,name,data,fetcher)=>upstream(env,`/rest/v1/rpc/${name}`,{token,method:'POST',data},fetcher);
async function identitySession(request,env,fetcher){
  const stored=cookies(request);let token=stored[names.access],renewed=null,verifiedUser=null;
  if(token){try{verifiedUser=await upstream(env,'/auth/v1/user',{token},fetcher);}catch(error){if(error.status!==401)throw error;token=null;}}
  if(!token&&stored[names.refresh]){renewed=await upstream(env,'/auth/v1/token?grant_type=refresh_token',{method:'POST',data:{refresh_token:stored[names.refresh]}},fetcher);token=renewed?.access_token;}
  if(!token)throw new ApiError(401,'Yönetici girişi yapın.');
  const user=verifiedUser||await upstream(env,'/auth/v1/user',{token},fetcher);
  if(!user?.email_confirmed_at)throw new ApiError(403,'Önce e-posta adresinizi doğrulayın.');
  return {token,user:{id:user.id,email:user.email,name:user.user_metadata?.full_name||''},renewed};
}
async function adminSession(request,env,fetcher){const session=await identitySession(request,env,fetcher);return {...session,user:await rpc(env,session.token,'admin_session',{},fetcher)};}
function password(value){if(typeof value!=='string'||value.length<12||value.length>128||value.includes('\0'))throw new InputError('Parola 12–128 karakter olmalı.');return value;}
const nextPath=value=>value==='/siparis/'?'/siparis/':'/hesabim/';

export async function handleApi(request,env,fetcher=fetch){
  const url=new URL(request.url),path=url.pathname;
  try{
    if(path==='/api/status'&&request.method==='GET')return json({salesEnabled:false,paymentsEnabled:false,prepared:true});
    if(path==='/api/customer/status'&&request.method==='GET')return json({enabled:env.CUSTOMER_AUTH_ENABLED==='true'});
    if(!['GET','POST','PATCH'].includes(request.method))throw new ApiError(405,'Bu istek yöntemi desteklenmiyor.');
    // Neither an accidental environment flag nor client-supplied totals can open checkout.
    if(path==='/api/orders'||path==='/api/payments')throw new ApiError(423,'Satış ve ödeme kapalı. Gerçek sipariş kabul edilmiyor.');
    if(request.method!=='GET'&&request.headers.get('Origin')!==(env.APP_ORIGIN||url.origin))throw new ApiError(403,'İstek kaynağı doğrulanamadı.');
    if(!configured(env))throw new ApiError(503,'Yönetim bağlantısı hazırlanıyor.');
    if(path.startsWith('/api/customer/')&&!['/api/customer/session','/api/customer/orders','/api/customer/status'].includes(path)&&env.CUSTOMER_AUTH_ENABLED!=='true')throw new ApiError(423,'Müşteri üyeliği e-posta gönderim hizmeti tamamlandıktan sonra açılacak. Misafir olarak formu inceleyebilirsiniz.');
    if(['/api/customer/signup','/api/customer/recovery'].includes(path)&&request.method==='POST'){
      const data=await body(request),address=email(data.email),verifier=randomToken(),isRecovery=path.endsWith('/recovery');
      const challenge=b64(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(verifier))));
      const values={email:address,code_challenge:challenge,code_challenge_method:'s256',...(isRecovery?{}:{password:password(data.password),data:{full_name:text(data.name,'Ad soyad',150)}})};
      await upstream(env,`/auth/v1/${isRecovery?'recover':'signup'}?redirect_to=${encodeURIComponent((env.APP_ORIGIN||url.origin)+'/api/auth/callback')}`,{method:'POST',data:values},fetcher);
      const response=json({message:isRecovery?'Adres kayıtlıysa şifre yenileme bağlantısı gönderildi.':'Kayıt isteği alındı. E-posta doğrulama bağlantısını aynı tarayıcıda açın.'});
      response.headers.append('Set-Cookie',cookie(names.verifier,verifier,600));response.headers.append('Set-Cookie',cookie(names.flow,isRecovery?'recovery':'customer',600));response.headers.append('Set-Cookie',cookie(names.next,nextPath(data.returnTo),600));return response;
    }
    if(path==='/api/customer/login'&&request.method==='POST'){
      const data=await body(request);const result=await upstream(env,'/auth/v1/token?grant_type=password',{method:'POST',data:{email:email(data.email),password:password(data.password)}},fetcher);
      if(!result.user?.email_confirmed_at)throw new ApiError(403,'Önce e-posta adresinizi doğrulayın.');
      const response=json({redirect:nextPath(data.returnTo)});sessionCookies(response,result);return response;
    }
    if(path==='/api/customer/session'&&request.method==='GET'){
      try{const session=await identitySession(request,env,fetcher);const response=json({authenticated:true,user:session.user});if(session.renewed)sessionCookies(response,session.renewed);return response;}catch(error){if([401,403].includes(error.status))return json({authenticated:false});throw error;}
    }
    if(path==='/api/customer/orders'&&request.method==='GET'){
      const session=await identitySession(request,env,fetcher);const response=json(await rpc(env,session.token,'customer_orders',{},fetcher));if(session.renewed)sessionCookies(response,session.renewed);return response;
    }
    if(path==='/api/customer/password'&&request.method==='PATCH'){
      const session=await identitySession(request,env,fetcher),data=await body(request);await upstream(env,'/auth/v1/user',{token:session.token,method:'PUT',data:{password:password(data.password)}},fetcher);const response=json({ok:true});if(session.renewed)sessionCookies(response,session.renewed);return response;
    }
    if(path==='/api/auth/start'&&request.method==='POST'){
      const data=await body(request);const address=email(data.email);const verifier=randomToken();
      const challenge=b64(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(verifier))));
      if(address===env.ADMIN_LOGIN_EMAIL.toLowerCase())await upstream(env,`/auth/v1/otp?redirect_to=${encodeURIComponent((env.APP_ORIGIN||url.origin)+'/api/auth/callback')}`,{method:'POST',data:{email:address,create_user:true,code_challenge:challenge,code_challenge_method:'s256'}},fetcher);
      const response=json({message:'Adres yetkiliyse giriş bağlantısı gönderildi. Bağlantıyı aynı tarayıcıda açın.'});
      response.headers.append('Set-Cookie',cookie(names.verifier,verifier,600));response.headers.append('Set-Cookie',cookie(names.flow,'admin',600));return response;
    }
    if(path==='/api/auth/callback'&&request.method==='GET'){
      const verifier=cookies(request)[names.verifier],code=url.searchParams.get('code');
      if(!verifier||!code||code.length>512)throw new ApiError(401,'Giriş bağlantısını istediğiniz tarayıcıda yeniden deneyin.');
      const data=await upstream(env,'/auth/v1/token?grant_type=pkce',{method:'POST',data:{auth_code:code,code_verifier:verifier}},fetcher);
      const flow=cookies(request)[names.flow]||'admin';
      if(flow==='admin')await rpc(env,data.access_token,'admin_session',{},fetcher);
      else {if(env.CUSTOMER_AUTH_ENABLED!=='true')throw new ApiError(423,'Müşteri üyeliği kapalı.');const user=await upstream(env,'/auth/v1/user',{token:data.access_token},fetcher);if(!user?.email_confirmed_at)throw new ApiError(403,'E-posta doğrulanmadı.');}
      const destination=flow==='admin'?'/yonetim/':flow==='recovery'?'/hesabim/#sifre-yenile':nextPath(cookies(request)[names.next]);
      const response=new Response(null,{status:303,headers:{...security,Location:(env.APP_ORIGIN||url.origin)+destination}});
      sessionCookies(response,data);for(const name of [names.verifier,names.flow,names.next])response.headers.append('Set-Cookie',cookie(name,'',0));return response;
    }
    if(path==='/api/auth/logout'&&request.method==='POST'){
      try{const session=await identitySession(request,env,fetcher);await upstream(env,'/auth/v1/logout?scope=local',{token:session.token,method:'POST'},fetcher);}catch{}
      return clearCookies(json({ok:true}));
    }
    let session;
    try{session=await adminSession(request,env,fetcher);}catch(error){if(path==='/api/session'&&[401,403].includes(error.status))return clearCookies(json({authenticated:false,admin:false}));throw error;}
    const {token,user}=session;let response;
    if(path==='/api/session'&&request.method==='GET')response=json({authenticated:true,admin:true,user});
    else if(path==='/api/admin/products'&&request.method==='GET')response=json(await rpc(env,token,'admin_products',{},fetcher));
    else if(/^\/api\/admin\/products\/[a-z]+$/.test(path)&&request.method==='PATCH')response=json(await rpc(env,token,'admin_update_product',{_id:path.split('/').at(-1),_data:validateProduct(await body(request))},fetcher));
    else if(path==='/api/admin/orders'&&request.method==='GET'){
      const status=url.searchParams.get('status');if(status&&!statuses.includes(status))throw new InputError('Sipariş durumu geçersiz.');
      response=json(await rpc(env,token,'admin_orders',{_status:status||null},fetcher));
    }
    else if(/^\/api\/admin\/orders\/[a-f0-9-]+$/.test(path)&&request.method==='GET')response=json(await rpc(env,token,'admin_order_detail',{_id:uuid(path.split('/').at(-1))},fetcher));
    else if(path==='/api/admin/test-orders'&&request.method==='POST'){
      const payload=validateOrder(await body(request)),trackingToken=randomToken();
      const result=await rpc(env,token,'admin_create_test_order',{_payload:payload,_token_hash:await tokenHash(trackingToken)},fetcher);
      if(payload.accountMode==='member')await rpc(env,token,'admin_link_test_order_member',{_id:result.id},fetcher);
      response=json({...result,trackingToken:result.created?trackingToken:null,isTest:true},result.created?201:200);
    }
    else if(/^\/api\/admin\/orders\/[a-f0-9-]+\/status$/.test(path)&&request.method==='PATCH'){
      const data=await body(request);if(!statuses.includes(data.status))throw new InputError('Sipariş durumu geçersiz.');
      response=json(await rpc(env,token,'admin_update_order_status',{_id:uuid(path.split('/')[4]),_status:data.status},fetcher));
    }
    else if(/^\/api\/admin\/orders\/[a-f0-9-]+\/fulfilment$/.test(path)&&request.method==='PATCH')response=json(await rpc(env,token,'admin_update_fulfilment',{_id:uuid(path.split('/')[4]),_data:validateFulfilment(await body(request))},fetcher));
    else if(path==='/api/tracking'&&request.method==='POST'){
      const data=await body(request);if(typeof data.token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(data.token))throw new InputError('Takip anahtarını kontrol edin.');
      response=json(await rpc(env,token,'admin_track_test_order',{_token_hash:await tokenHash(data.token)},fetcher));
    }else throw new ApiError(404,'İşlem bulunamadı.');
    if(session.renewed)sessionCookies(response,session.renewed);return response;
  }catch(error){
    if(path==='/api/auth/callback'){
      let flow;try{flow=cookies(request)[names.flow];}catch{}
      const destination=['customer','recovery'].includes(flow)?'/hesabim/':'/yonetim/';
      return clearCookies(new Response(null,{status:303,headers:{...security,Location:(env.APP_ORIGIN||url.origin)+destination+'#giris-hatasi'}}));
    }
    return json({error:error instanceof InputError?error.message:error instanceof ApiError?error.message:'İşlem tamamlanamadı. Daha sonra tekrar deneyin.'},error instanceof InputError?400:error instanceof ApiError?error.status:503);
  }
}
export default {async fetch(request,env){if(new URL(request.url).pathname.startsWith('/api/'))return handleApi(request,env);return env.ASSETS.fetch(request);}};
