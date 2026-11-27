import {api,esc,message} from './preparation.js';
import {cardUnitMinor,cardSubtotalMinor,formatCardPrice,dynamicQrChangeLimit} from './card-pricing.js';
import {products,restoreCart,connectionLabels,linkLabels,menuLabels,contactUrl} from './shop.js';
import {renderCardMedia} from './product-media.js';
import {validateOrder} from '../worker/validation.js';
const form=document.querySelector('#order-form'),notice=document.querySelector('#order-message'),submit=document.querySelector('#order-submit');
let requestKey=crypto.randomUUID(),canSubmit=false,cart=[],accountMode='guest';
try{cart=restoreCart(sessionStorage.getItem('nfc-preview-cart'));}catch{}
document.querySelector('#order-layout').hidden = !cart.length;
document.querySelector('#order-preview-note').hidden = !cart.length;
document.querySelector('#empty-order').hidden = Boolean(cart.length);
if (cart.length) document.querySelector('#order-items').innerHTML=cart.map((item,index)=>{
  const p=products.find(p=>p.id===item.productId),isIban=p.id==='iban',design=p.id==='menu'&&['design-pdf','design-web'].includes(item.menuType),pdf=p.id==='menu'&&item.menuType==='pdf';
  const lockPreference=item.connection==='qr'?'':`<label class="prep-check full prep-nfc-lock"><input type="checkbox" name="lockNfc-${index}"><span><strong>NFC etiketini yazmaya kilitle</strong><small>Kilit kalıcıdır. Kartın NFC etiketi teslimden sonra yeniden yazılamaz.</small></span></label>`;
  const dynamicHint=item.linkType==='dynamic'?`<p class="prep-small full">Kart başına ${dynamicQrChangeLimit} QR adresi değişikliği dahil. <a class="text-link" href="${esc(contactUrl('Merhaba, dinamik QR adresimi değiştirmek istiyorum.'))}" target="_blank" rel="noopener noreferrer">Değişiklik için WhatsApp’tan iletişime geçin.</a></p>`:'';
  const linkLabel=item.connection==='qr'?'QR kodunun açacağı bağlantı':item.connection==='nfc'?'NFC etiketinin açacağı bağlantı':'QR ve NFC’nin açacağı bağlantı';
  return `<section class="prep-item" data-item-index="${index}"><div class="prep-item-top">${renderCardMedia(p,{base:'../',connection:item.connection,material:item.material,placement:'cart'})}<div><h3>${esc(p.name)} · ${item.quantity} adet</h3><p>${esc(item.size)} cm · ${connectionLabels[item.connection]} · ${linkLabels[item.linkType]}${item.menuType?' · '+menuLabels[item.menuType]:''}</p></div></div><div class="prep-fields"><label class="prep-field full">İşletme adı<input name="businessName-${index}" required maxlength="150"></label>${isIban?`<label class="prep-field full">Hesap sahibi adı / unvanı<input name="accountHolder-${index}" required maxlength="150"></label><label class="prep-field full">IBAN<input name="iban-${index}" required maxlength="40" spellcheck="false" autocomplete="off" placeholder="TR…"><small>Yalnız kartta gösterilecek hesap bilgisi. Bu form para transferi yapmaz.</small></label>`:`<label class="prep-field full">${design?'Varsa mevcut menü bağlantısı':pdf?'PDF dosyası bağlantısı':linkLabel}<input name="targetUrl-${index}" type="url" ${design?'':'required'} maxlength="2048" placeholder="https://…"><small>${pdf?'Dosya yükleme henüz açık değil; erişilebilir PDF bağlantısını yazın.':design?'İsteğe bağlı. Tasarım beklentinizi aşağıda açıklayın.':item.connection==='hybrid'?'QR ve NFC için aynı başlangıç hedefi kullanılır.':'Kartın açmasını istediğiniz tam bağlantıyı yazın.'}</small></label>`}${lockPreference}${dynamicHint}<p class="prep-small full">${item.linkType === 'dynamic' ? 'Dinamik kartta teslimden itibaren 14 gün cayma hakkınız vardır.' : 'Size özel baskılı kartta cayma hakkı istisnası uygulanır.'} <a href="/bilgi/mesafeli-satis/">Satış sözleşmesi</a> · <a href="/bilgi/on-bilgilendirme/">Ön bilgilendirme</a></p><label class="prep-field full">${design?'Menü tasarım beklentiniz':'Tasarım notu (isteğe bağlı)'}<textarea name="notes-${index}" maxlength="1500" ${design?'required':''}></textarea></label></div></section>`;
}).join('');
document.querySelector('#order-summary').innerHTML=cart.map(item=>`<div><strong>${esc(products.find(p=>p.id===item.productId).name)}</strong><p>${item.quantity} adet · ${esc(item.size)} cm · ${connectionLabels[item.connection]} · ${linkLabels[item.linkType]}</p><p>${formatCardPrice(cardUnitMinor(item)*item.quantity)}</p></div>`).join('')||'<p>Sepet boş.</p>';
document.querySelector('#order-items-total').textContent=cart.length?formatCardPrice(cardSubtotalMinor(cart)):'—';
const billingFields=document.querySelector('#billing-address-fields');
const individualFields=document.querySelector('#individual-fields');
const companyFields=document.querySelector('#company-fields');
const identity=document.querySelector('#billing-identity');

function syncBillingFields(){
  const company=form.elements.billingType.value==='company';
  companyFields.hidden=!company;
  individualFields.hidden=identity.disabled=company;
  for(const name of ['company','taxOffice','taxNumber']){
    form.elements[name].disabled=!company;
    form.elements[name].required=company;
  }
  billingFields.hidden=billingFields.disabled=!form.elements.separateBilling.checked;
}
form.addEventListener('change',event=>{
  if(['billingType','separateBilling'].includes(event.target.name))syncBillingFields();
});
window.addEventListener('pageshow',syncBillingFields);
syncBillingFields();
form.addEventListener('submit',async event=>{
  event.preventDefault();if(!canSubmit||!cart.length)return;submit.disabled=true;submit.setAttribute('aria-busy','true');
  try{
    const values=Object.fromEntries(new FormData(form));
    const payload=validateOrder({requestKey,accountMode,contact:{name:values.name,email:values.email,phone:values.phone},address:{recipient:values.recipient,line1:values.line1,city:values.city,district:values.district,postcode:values.postcode,country:'TR'},billing:{type:values.billingType,company:values.company,taxOffice:values.taxOffice,taxNumber:values.taxNumber,...(values.separateBilling?{address:{line1:values.billingLine1,city:values.billingCity,district:values.billingDistrict,postcode:values.billingPostcode,country:'TR'}}:{})},confirmTest:form.elements.confirmTest.checked,items:cart.map((item,index)=>({...item,sizeCm:Number(item.size.split('x')[0]),menuService:item.menuType,personalization:{businessName:values[`businessName-${index}`],targetUrl:values[`targetUrl-${index}`],lockNfc:values[`lockNfc-${index}`]==="on",notes:values[`notes-${index}`],accountHolder:values[`accountHolder-${index}`],iban:values[`iban-${index}`]}}))});
    const result=await api('/api/admin/test-orders',{method:'POST',data:payload});
    document.querySelector('#order-layout').hidden=true;const panel=document.querySelector('#order-result');panel.hidden=false;
    const link=result.trackingToken?new URL(`../siparis-takibi/#token=${result.trackingToken}`,location.href).href:'';
    panel.innerHTML=`<h2>Test kaydı ${result.created?'oluşturuldu':'zaten oluşturulmuş'}.</h2><p class="prep-small">Ödeme alınmadı. Üretim ve kargo başlatılmadı.</p><p style="margin-top:16px">Kayıt: <strong>${esc(result.id)}</strong></p>${link?`<p class="prep-small" style="margin-top:16px">Bu test takip bağlantısı 30 gün geçerlidir ve yönetici girişi gerektirir. Bağlantıyı paylaşmayın.</p><p class="prep-token" style="margin-top:12px">${esc(link)}</p><div class="prep-actions"><a class="button outline" href="${esc(link)}">Test siparişini takip et</a></div>`:''}<div class="prep-actions"><a class="button primary" href="../yonetim/">Yönetim paneline dön</a><a class="text-link" href="./">Yeni test hazırla</a></div>`;
    form.reset();syncBillingFields();panel.scrollIntoView({behavior:'auto',block:'start'});
  }catch(error){message(notice,error.message,true);notice.scrollIntoView({behavior:'auto',block:'center'});}finally{submit.disabled=!canSubmit;submit.removeAttribute('aria-busy');}
});
async function start(){
  if(new URLSearchParams(location.search).get('misafir')!=='1'){try{const customer=await api('/api/customer/session');if(customer.authenticated){accountMode='member';form.elements.email.value=customer.user.email;}}catch{}}
  try{const session=await api('/api/session');canSubmit=session.admin&&cart.length>0;submit.disabled=!canSubmit;document.querySelector('#order-access').textContent=session.admin?'Yönetici doğrulandı. Yalnızca test kaydı oluşturabilirsiniz.':'Test kaydı için yönetim panelinden giriş yapın. Form bilgileri sunucuya gönderilmez.';}catch{document.querySelector('#order-access').textContent='Yönetim bağlantısı hazır değil. Bu form şu anda kayıt göndermez.';}
}
if (cart.length) start();
window.addEventListener('pageshow', event => {
  if (!event.persisted) return;
  try {
    const currentCart = restoreCart(sessionStorage.getItem('nfc-preview-cart'));
    if (JSON.stringify(currentCart) !== JSON.stringify(cart)) location.reload();
  } catch {}
});
