import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCatalogRows, applyCatalogSnapshot } from '../src/catalog-bridge.js';

const row = {id:'google',name:'Google Yorum Kartı',description:'Bir dokunuş.',label:'Google',headline:'Yorum bırakın.',subtitle:'İşletmemizi değerlendirin.',price_minor:null,currency:'TRY',is_purchasable:false};
test('remote catalog cannot inject HTML or attributes into existing preview renderers',()=>{
  for(const payload of ['<img src=x onerror=alert(1)>','" autofocus onfocus=alert(1)','&#60;script>']) {
    assert.throws(()=>validateCatalogRows([{...row,name:payload}],['google']));
  }
});
test('preview never enables checkout or displays remote prices',()=>{
  const products = [{id:'google',name:'Old',price:null}];
  applyCatalogSnapshot(products,[{...row,price_minor:25000}]);
  assert.equal(products[0].price,null);
  assert.equal(products[0].name,row.name);
  assert.throws(()=>validateCatalogRows([{...row,is_purchasable:true}],['google']));
  assert.throws(()=>validateCatalogRows([{...row,price_minor:-1}],['google']));
});
test('partial, duplicate and unknown catalog rows are rejected',()=>{
  assert.throws(()=>validateCatalogRows([],['google']));
  assert.throws(()=>validateCatalogRows([row,row],['google','instagram']));
  assert.throws(()=>validateCatalogRows([{...row,id:'unknown'}],['google']));
});
