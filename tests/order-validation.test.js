import test from 'node:test';
import assert from 'node:assert/strict';
import {validateOrder,validateProduct,validIban,priceMinor,validateFulfilment} from '../worker/validation.js';
export const orderFixture=()=>({requestKey:'69ed535f-aad3-4f36-9f23-70a9ca4b2581',contact:{name:'Hazırlık Testi',email:'test@example.invalid',phone:'05551234567'},address:{recipient:'Hazırlık Testi',line1:'Test adresi',city:'Sakarya',district:'Serdivan',postcode:'54000',country:'TR'},billing:{type:'individual'},items:[{productId:'google',sizeCm:10,material:'clear',connection:'hybrid',linkType:'static',quantity:1,personalization:{businessName:'Örnek İşletme',targetUrl:'https://example.org/yorum',notes:''}}],confirmTest:true});
test('complete guest form is normalized without accepting client totals or identity roles',()=>{
  const input=orderFixture();input.totalMinor=1;input.is_test=false;input.contact.role='owner';input.items[0].unit_price_minor=1;
  const result=validateOrder(input);
  assert.equal(result.contact.phone,'905551234567');assert.equal(result.contact.role,undefined);assert.equal(result.totalMinor,undefined);assert.equal(result.is_test,undefined);assert.equal(result.items[0].unit_price_minor,undefined);
});
test('invalid destination, contact, retired size, NFC dynamic and missing personalization are rejected',()=>{
  for(const mutate of [p=>p.address.country='DE',p=>p.address.country=null,p=>p.address.postcode='bad',p=>p.contact.phone='123',p=>p.contact.email='bad',p=>p.items[0].sizeCm=12,p=>{p.items[0].connection='nfc';p.items[0].linkType='dynamic';},p=>p.items[0].personalization.businessName='',p=>p.items[0].personalization.targetUrl='javascript:alert(1)',p=>p.items[0].quantity=0,p=>p.confirmTest=false]) {const input=orderFixture();mutate(input);assert.throws(()=>validateOrder(input));}
});
test('company, IBAN and menu orders require their own information',()=>{
  const corporate=orderFixture();corporate.billing={type:'company'};assert.throws(()=>validateOrder(corporate));
  corporate.billing={type:'company',company:'Örnek Firma',taxOffice:'Test',taxNumber:'1234567890'};assert.equal(validateOrder(corporate).billing.type,'company');
  const iban=orderFixture();iban.items[0].productId='iban';assert.throws(()=>validateOrder(iban));
  assert.throws(()=>validIban('TR000000000000000000000000'));
  const menu=orderFixture();menu.items[0].productId='menu';menu.items[0].menuService='design-web';menu.items[0].personalization.notes='';assert.throws(()=>validateOrder(menu));
  menu.items[0].personalization.notes='İki dilde menü tasarımı';assert.equal(validateOrder(menu).items[0].menuService,'design-web');
  menu.items[0].menuService='pdf';menu.items[0].personalization.targetUrl='';assert.throws(()=>validateOrder(menu));
});
test('prices use integer cents and product edits cannot inject markup',()=>{
  assert.equal(priceMinor('250,50'),25050);assert.equal(priceMinor('0,01'),1);assert.equal(priceMinor(''),null);
  for(const value of ['1.000,00','-1','1,999','Infinity'])assert.throws(()=>priceMinor(value));
  assert.throws(()=>validateProduct({name:'<script>',description:'Test',price_minor:null}));
  assert.throws(()=>validateFulfilment({trackingNumber:'123'}));
});

test('NFC lock is optional and a dynamic QR order uses the server limit',()=>{
  const input=orderFixture();
  const line=input.items[0];
  line.linkType='dynamic';
  line.personalization.lockNfc=true;
  line.personalization.qrChangeLimit=99;
  const data=validateOrder(input).items[0].personalization;
  assert.equal(data.lockNfc,true);
  assert.equal(data.qrChangeLimit,3);
  line.connection='qr';
  assert.throws(()=>validateOrder(input),/NFC kilidi/);
  delete line.personalization.lockNfc;
  assert.equal(validateOrder(input).items[0].personalization.lockNfc,undefined);
});
