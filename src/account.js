import {api,esc,date,message} from './preparation.js';
import {email,statusLabels} from '../worker/validation.js';
const notice=document.querySelector('#account-message');
const returnTo=new URLSearchParams(location.search).get('devam')==='siparis'?'/siparis/':'/hesabim/';
let enabled=false;
function tab(name){
  for(const value of ['login','signup']){document.querySelector(`#${value}-form`).hidden=name!==value;const button=document.querySelector(`#${value}-tab`);button.setAttribute('aria-selected',String(name===value));button.tabIndex=name===value?0:-1;}
  document.querySelector('#recovery-form').hidden=name!=='recovery';
  document.querySelector('.account-tabs').hidden=name==='recovery';
}
tab('login');
if(location.hash==='#giris-hatasi'){message(notice,'Giriş bağlantısı geçersiz veya süresi dolmuş. Bağlantıyı istediğiniz tarayıcıda yeniden deneyin.',true);history.replaceState(null,'',location.pathname+location.search);}
for(const value of ['login','signup'])document.querySelector(`#${value}-tab`).addEventListener('click',()=>tab(value));
document.querySelector('.account-tabs').addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();const value=event.key==='Home'?'login':event.key==='End'?'signup':document.querySelector('#login-tab').getAttribute('aria-selected')==='true'?'signup':'login';tab(value);document.querySelector(`#${value}-tab`).focus();}});
document.querySelector('#show-recovery').addEventListener('click',()=>tab('recovery'));
document.querySelector('#back-to-login').addEventListener('click',()=>tab('login'));
for(const kind of ['login','signup','recovery'])document.querySelector(`#${kind}-form`).addEventListener('submit',async event=>{
  event.preventDefault();if(!enabled)return;const button=event.currentTarget.querySelector('button[type=submit]');button.disabled=true;button.setAttribute('aria-busy','true');
  try{const data=Object.fromEntries(new FormData(event.currentTarget));data.email=email(data.email);data.returnTo=returnTo;if(kind==='signup'&&data.password!==data.passwordAgain)throw new Error('Parolalar eşleşmiyor.');delete data.passwordAgain;const result=await api(`/api/customer/${kind}`,{method:'POST',data});if(result.redirect)location.href=result.redirect;else{message(notice,result.message);event.target.reset();}}catch(error){message(notice,error.message,true);}finally{button.disabled=!enabled;button.removeAttribute('aria-busy');}
});
document.querySelector('#account-logout').addEventListener('click',async()=>{try{await api('/api/auth/logout',{method:'POST'});location.reload();}catch(error){message(notice,error.message,true);}});
document.querySelector('#password-form').addEventListener('submit',async event=>{event.preventDefault();try{await api('/api/customer/password',{method:'PATCH',data:{password:new FormData(event.currentTarget).get('password')}});event.target.reset();message(notice,'Parolanız güncellendi.');}catch(error){message(notice,error.message,true);}});
async function start(){
  try{
    const status=await api('/api/customer/status');enabled=status.enabled;document.querySelector('#auth-readiness').hidden=enabled;
    document.querySelectorAll('#account-gate button[type=submit]').forEach(button=>button.disabled=!enabled);
    const session=await api('/api/customer/session');if(!session.authenticated)return;
    document.querySelector('#account-gate').hidden=true;document.querySelector('#account-home').hidden=false;document.querySelector('#account-identity').textContent=session.user.email;
    if(location.hash==='#sifre-yenile'){document.querySelector('#password-form').hidden=false;history.replaceState(null,'',location.pathname);}
    const rows=await api('/api/customer/orders');document.querySelector('#account-orders').innerHTML=`<h2>Siparişlerim</h2>${rows.length?rows.map(order=>`<article class="prep-item"><strong>${esc(order.id.slice(0,8))} · ${esc(statusLabels[order.status])}</strong><p class="prep-small">${date(order.created_at)}${order.is_test?' · Test kaydı':''}</p></article>`).join(''):'<p class="prep-small" style="margin-top:12px">Henüz hesabınıza bağlı sipariş yok. Satış ve ödeme kapalıdır.</p>'}`;
  }catch{document.querySelector('#auth-readiness').hidden=false;message(notice,'Hesap bağlantısı hazırlanıyor. Misafir olarak formu inceleyebilirsiniz.');}
}
start();
