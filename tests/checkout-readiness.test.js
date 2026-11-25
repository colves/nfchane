import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {prepareCheckoutReview, acceptCheckoutReview, checkoutAttachment} from '../worker/checkout-review.js';
import {verifyPaytrNotification} from '../worker/paytr-notification.js';
import {prepareInvoiceRecord} from '../worker/invoice-preparation.js';

function fixture() {
  const billing = {type:'individual',address:{line1:'Fatura adresi'}};
  const item = {productId:'google',quantity:1,connection:'hybrid',linkType:'dynamic',personalization:{}};
  return {
    order:{requestKey:'test-request',contact:{name:'Örnek Alıcı'},address:{line1:'Teslimat adresi'},billing,
      items:[item,item,item]},
    lines:['custom_print','standard','resettable'].map(productionType=>({
      productId:'google',productName:'Örnek kart',unitMinor:12000,vatBasisPoints:2000,productionType,
    })),
    shipping:{approved:true,grossMinor:1200,vatBasisPoints:2000,carrier:'Örnek kargo',deliveryTerms:'Test koşulu'},
    seller:{approved:true,legalName:'Örnek Satıcı',address:'Örnek adres',email:'seller@example.invalid',phone:'000',kep:'seller@example.invalid'},
    documents:{preInformation:{approved:true,version:'test-1',text:'İlk içerik'},distanceContract:{approved:true,version:'test-2',text:'İkinci içerik'}},
  };
}
const approve = review => ({reviewId:review.reviewId,preInformationConfirmed:true,distanceContractAccepted:true});

test('review fails closed and binds server price and both documents to the acceptance', async () => {
  const data=fixture();
  const review=await prepareCheckoutReview(data);
  assert.deepEqual(review.snapshot.totals,{currency:'TRY',subtotalMinor:36000,shippingMinor:1200,taxMinor:6200,totalMinor:37200});
  assert.deepEqual(review.snapshot.items.map(item=>item.withdrawal),['personalised_goods','standard_withdrawal','standard_withdrawal']);
  const record=acceptCheckoutReview(review,approve(review));
  data.documents.preInformation.text='Yeni içerik';
  const updated=await prepareCheckoutReview(data);
  assert.throws(()=>acceptCheckoutReview(updated,approve(review)));
  assert.throws(()=>acceptCheckoutReview(review,{...approve(review),distanceContractAccepted:false}));
  const attachment=checkoutAttachment(record);
  assert.match(attachment,/İlk içerik/);
  assert.match(attachment,/Ayıplı, yanlış, hasarlı/);
  assert.doesNotMatch(attachment,/Yeni içerik/);
  for (const invalidate of [
    data=>{data.seller.approved=false;},
    data=>{data.documents.distanceContract.approved=false;},
    data=>{data.shipping.grossMinor=null;},
    data=>{data.lines[0].vatBasisPoints=null;},
    data=>{data.lines[0].productionType=null;},
  ]) {
    const copy=fixture();
    invalidate(copy);
    await assert.rejects(prepareCheckoutReview(copy));
  }
});

test('PayTR sandbox fixture verifies signature and stored attempt, invoice needs a real verified payment', async () => {
  const credentials={key:'test-key',salt:'test-salt'};
  const attempt={reference:'NFCTest01',amountMinor:37200,currency:'TRY',installments:false,test:true};
  const fields={merchant_oid:attempt.reference,status:'success',total_amount:'37200',payment_amount:'37200',currency:'TL',payment_type:'card',test_mode:'1'};
  const sign = ({merchant_oid,status,total_amount}) => createHmac('sha256',credentials.key)
    .update(merchant_oid+credentials.salt+status+total_amount).digest('base64');
  fields.hash=sign(fields);
  assert.equal((await verifyPaytrNotification(fields,attempt,credentials)).amountMinor,37200);
  assert.equal(await verifyPaytrNotification({...fields,total_amount:'1'},attempt,credentials),null);
  const signedMismatch={...fields,total_amount:'37100'};
  signedMismatch.hash=sign(signedMismatch);
  assert.equal(await verifyPaytrNotification(signedMismatch,attempt,credentials),null);
  assert.equal(await verifyPaytrNotification(fields,{...attempt,test:false},credentials),null);

  const review=await prepareCheckoutReview(fixture());
  const input={
    order:{id:'test-order',is_test:false,status:'paid',total_minor:37200},
    review:{order_id:'test-order',snapshot:review.snapshot},
    payment:{order_id:'test-order',amount_minor:37200,currency:'TRY',method:'card',verified_at:'2026-11-25T10:00:00Z',is_test:false},
    shipment:{carrier_name:'Örnek kargo',shipped_at:'2026-11-26T10:00:00Z'},
    invoice:{invoice_number:'TEST001'},
  };
  assert.throws(()=>prepareInvoiceRecord({...input,payment:{...input.payment,is_test:true}}));
  assert.throws(()=>prepareInvoiceRecord({...input,payment:null}));
  const invoice=prepareInvoiceRecord(input);
  assert.equal(invoice.address.line1,'Fatura adresi');
  assert.equal(invoice.totals.totalMinor,37200);
  assert.equal(invoice.requestedDocumentType,null);
  assert.equal(invoice.documentNumber,'TEST001');
});
