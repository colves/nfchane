import {provinces} from './provinces.js';
import {dynamicQrChangeLimit} from '../src/card-pricing.js';

export class InputError extends Error {}
const fail = message => { throw new InputError(message); };
const ids = ['google','instagram','whatsapp','menu','web','iban','ilan'];
const methods = ['hybrid','nfc','qr'];
const menus = ['link','pdf','design-pdf','design-web'];
export const statuses = ['awaiting_payment','paid','preparing','shipped','delivered','cancelled','refunded'];
export const statusLabels = {awaiting_payment:'Ödeme bekleniyor',paid:'Ödeme alındı',preparing:'Hazırlanıyor',shipped:'Kargoya verildi',delivered:'Teslim edildi',cancelled:'İptal edildi',refunded:'İade edildi'};
const object = value => value && typeof value === 'object' && !Array.isArray(value);
export function text(value, label, max = 200, required = true) {
  if (typeof value !== 'string') { if (!required && value == null) return ''; fail(`${label} alanını kontrol edin.`); }
  const result = value.trim();
  if ((required && !result) || result.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f<>]/.test(result)) fail(`${label} alanını kontrol edin.`);
  return result;
}
export function email(value) {
  const result = text(value,'E-posta',254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) fail('Geçerli bir e-posta adresi yazın.');
  return result;
}
export function uuid(value) {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) fail('İşlem kimliği geçersiz.');
  return value.toLowerCase();
}
export function safeUrl(value, required = true) {
  const raw = text(value,'Bağlantı',2048,required);
  if (!raw) return '';
  try { const url = new URL(raw); if (!['https:','http:'].includes(url.protocol) || url.username || url.password || !url.hostname.includes('.')) fail('Bağlantı http veya https ile başlamalı.'); return url.href; }
  catch { fail('Geçerli bir http/https bağlantısı yazın.'); }
}
export function validIban(value) {
  const iban = text(value,'IBAN',40).replace(/\s/g,'').toUpperCase();
  if (!/^TR\d{24}$/.test(iban)) fail('Türkiye IBAN’ı TR ile başlayan 26 karakter olmalı.');
  let remainder = 0;
  for (const char of iban.slice(4)+iban.slice(0,4)) for (const digit of (/\d/.test(char) ? char : String(char.charCodeAt(0)-55))) remainder = (remainder*10+Number(digit))%97;
  if (remainder !== 1) fail('IBAN kontrolü başarısız. Numarayı kontrol edin.');
  return iban;
}
export function priceMinor(value) {
  if (value === '' || value == null) return null;
  if (typeof value === 'number') { if (!Number.isSafeInteger(value) || value<0 || value>100000000) fail('Fiyat geçersiz.'); return value; }
  const raw = value.trim();
  if (!/^\d{1,7}([,.]\d{1,2})?$/.test(raw)) fail('Fiyatı 250,00 biçiminde, binlik ayırıcı kullanmadan yazın.');
  const [whole,decimal=''] = raw.replace(',','.').split('.');
  return priceMinor(Number(whole)*100+Number(decimal.padEnd(2,'0')));
}
export function validateProduct(input) {
  if (!object(input)) fail('Ürün bilgileri geçersiz.');
  const name=text(input.name,'Ürün adı',150), description=text(input.description,'Açıklama',2000);
  if (/[&"]/.test(name+description)) fail('Ürün metninde HTML veya çift tırnak kullanmayın.');
  return {name,description,price_minor:priceMinor(input.price_minor)};
}
function streetAddress(value, label) {
  const street = text(value, label, 500);
  if (street.length < 5) fail(label + ' en az 5 karakter olmalı.');
  return street;
}

function province(value) {
  const city = text(value, 'İl', 80);
  const canonical = provinces.find(name => name.localeCompare(city, 'tr', {sensitivity:'base'}) === 0);
  if (!canonical) fail('Listeden geçerli bir il seçin.');
  return canonical;
}

export function validateOrder(input) {
  if (!object(input) || !Array.isArray(input.items) || input.items.length<1 || input.items.length>30) fail('Sepette 1–30 ürün seçimi olmalı.');
  const requestKey=uuid(input.requestKey);
  const c=input.contact, a=input.address, b=input.billing;
  if (!object(c)||!object(a)||!object(b)) fail('İletişim, teslimat ve fatura bilgilerini tamamlayın.');
  const phone=text(c.phone,'Telefon',30).replace(/[\s()+-]/g,'');
  if (!/^(?:0?5\d{9}|905\d{9})$/.test(phone)) fail('Geçerli bir Türkiye cep telefonu yazın.');
  const contact={name:text(c.name,'Ad soyad',150),email:email(c.email),phone:phone.startsWith('90')?phone:`90${phone.replace(/^0/,'')}`};
  if (a.country !== 'TR') fail('Gönderim yalnızca Türkiye’ye yapılacak.');
  const address={recipient:text(a.recipient,'Teslim alacak kişi',150),line1:streetAddress(a.line1,'Açık adres'),city:province(a.city),district:text(a.district,'İlçe',80),postcode:text(a.postcode,'Posta kodu',5),country:'TR'};
  if (!/^\d{5}$/.test(address.postcode)) fail('Posta kodu 5 rakam olmalı.');
  if (!['individual','company'].includes(b.type)) fail('Fatura türünü seçin.');
  const billing={type:b.type,name:contact.name};
  if (b.type==='company') {
    billing.company=text(b.company,'Firma unvanı',200); billing.taxOffice=text(b.taxOffice,'Vergi dairesi',100); billing.taxNumber=text(b.taxNumber,'Vergi numarası',10);
    if (!/^\d{10}$/.test(billing.taxNumber)) fail('Vergi numarası 10 rakam olmalı.');
  }
  if (b.address != null) {
    if (!object(b.address) || b.address.country !== 'TR') fail('Fatura adresini kontrol edin.');
    const {line1,city,district,postcode}=b.address;
    billing.address={line1:streetAddress(line1,'Fatura açık adresi'),city:province(city),district:text(district,'Fatura ilçesi',80),postcode:text(postcode,'Fatura posta kodu',5),country:'TR'};
    if (!/^\d{5}$/.test(billing.address.postcode)) fail('Fatura posta kodu 5 rakam olmalı.');
  }
  const seen=new Set();
  const items=input.items.map(item=>{
    if(!object(item)||!ids.includes(item.productId)||!methods.includes(item.connection)||!['static','dynamic'].includes(item.linkType)) fail('Ürün seçeneklerini kontrol edin.');
    if(item.sizeCm!==10||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>1000||item.material!=='clear') fail('Kart 10 × 10 cm, şeffaf pleksi olmalı; adet 1–1000 arasında olmalı.');
    if(item.connection==='nfc'&&item.linkType!=='static') fail('Yalnız NFC için sabit bağlantı seçilmeli.');
    const menuService=item.productId==='menu'?item.menuService:null;
    if(item.productId==='menu'&&!menus.includes(menuService)) fail('Menü hizmetini seçin.');
    const p=object(item.personalization)?item.personalization:{};
    const personalization={businessName:text(p.businessName,'İşletme adı',150),notes:text(p.notes,'Tasarım notu',1500,false)};
    if(p.lockNfc!=null && typeof p.lockNfc!=='boolean') fail('NFC kilitleme tercihini kontrol edin.');
    if(item.connection==='qr' && p.lockNfc===true) fail('Yalnız QR kartta NFC kilidi seçilemez.');
    if(p.lockNfc===true) personalization.lockNfc=true;
    if(item.linkType==='dynamic') personalization.qrChangeLimit=dynamicQrChangeLimit;
    if(item.productId==='iban') { personalization.accountHolder=text(p.accountHolder,'Hesap sahibi',150); personalization.iban=validIban(p.iban); }
    else if(item.productId==='menu'&&menuService!=='link') {
      personalization.targetUrl=safeUrl(p.targetUrl,false);
      if(menuService==='pdf'&&!personalization.targetUrl) fail('Hazır PDF için dosya bağlantısını yazın.');
      if(['design-pdf','design-web'].includes(menuService)&&!personalization.notes) fail('Menü tasarımı için beklentinizi not alanına yazın.');
    } else personalization.targetUrl=safeUrl(p.targetUrl);
    const key=[item.productId,item.sizeCm,item.connection,item.linkType,menuService||''].join(':');
    if(seen.has(key)) fail('Aynı seçenekleri tek satırda birleştirin.'); seen.add(key);
    return {productId:item.productId,sizeCm:item.sizeCm,material:'clear',connection:item.connection,linkType:item.linkType,quantity:item.quantity,menuService,personalization};
  });
  if (input.preInformationConfirmed !== true) fail('Ön bilgilendirme formunu okuduğunuzu teyit edin.');
  if (input.distanceContractAccepted !== true) fail('Test işlemi için mesafeli satış sözleşmesini onaylayın.');
  if(input.confirmTest!==true) fail('Bunun gerçek satış olmayan test kaydı olduğunu onaylayın.');
  const accountMode=input.accountMode||'guest';if(!['guest','member'].includes(accountMode))fail('Hesap tercihini kontrol edin.');
  return {requestKey,contact,address,billing,items,accountMode,preInformationConfirmed:true,distanceContractAccepted:true,confirmTest:true};
}
export function validateFulfilment(input) {
  if(!object(input)) fail('Kargo/fatura bilgileri geçersiz.');
  const result={carrier:text(input.carrier,'Kargo firması',100,false),trackingNumber:text(input.trackingNumber,'Takip numarası',100,false),invoiceNumber:text(input.invoiceNumber,'Fatura numarası',100,false),invoiceType:input.invoiceType||null,invoiceDate:input.invoiceDate||null};
  if(result.invoiceType&&!['e_invoice','e_archive'].includes(result.invoiceType)) fail('Fatura türü geçersiz.');
  if(result.invoiceDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(result.invoiceDate)||!Number.isFinite(Date.parse(result.invoiceDate)))) fail('Fatura tarihi geçersiz.');
  if(result.invoiceNumber&&(!result.invoiceType||!result.invoiceDate)) fail('Fatura türünü ve tarihini tamamlayın.');
  if(result.trackingNumber&&!result.carrier) fail('Kargo firmasını yazın.');
  return result;
}
