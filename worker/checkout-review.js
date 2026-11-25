// These functions run against server-controlled configuration and prices.
const printTypes = ['custom_print', 'standard', 'resettable'];
const legalKeys = ['preInformation', 'distanceContract'];
const encoder = new TextEncoder();

export function withdrawalRule(line) {
  if (!printTypes.includes(line.productionType)) throw new Error('Üretim biçimi doğrulanmadı.');
  return line.productionType === 'custom_print' ? 'personalised_goods' : 'standard_withdrawal';
}

function amount(value) {
  if (!Number.isInteger(value) || value < 0 || value > 2147483647) throw new Error('Doğrulanmış tutar gerekli.');
  return value;
}

function tax(gross, rate) {
  if (!Number.isInteger(rate) || rate < 0 || rate > 10000) throw new Error('Doğrulanmış KDV oranı gerekli.');
  return Math.round(gross * rate / (10000 + rate));
}

async function digest(value) {
  const bytes = await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(value)));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function prepareCheckoutReview({order, lines, shipping, seller, documents}) {
  if (!seller?.approved || !['legalName','address','email','phone','kep'].every(key => seller[key]?.trim())) {
    throw new Error('Satıcı bilgileri doğrulanmadı.');
  }
  if (!legalKeys.every(key => documents?.[key]?.approved && documents[key].version?.trim() && documents[key].text?.trim())) {
    throw new Error('Satış belgeleri onay bekliyor.');
  }
  if (!shipping?.approved || !shipping.carrier?.trim() || !shipping.deliveryTerms?.trim()) {
    throw new Error('Teslimat bilgileri doğrulanmadı.');
  }
  if (!lines.length || lines.length !== order.items.length) throw new Error('Sepet yeniden incelenmeli.');

  const items = lines.map((line, index) => {
    const item = order.items[index];
    if (line.productId !== item.productId || !line.productName?.trim()) throw new Error('Ürün bilgisi doğrulanmadı.');
    const {quantity, connection, linkType, menuService, personalization} = item;
    const unitMinor = amount(line.unitMinor);
    const grossMinor = amount(unitMinor * quantity);
    return {productId:item.productId, productName:line.productName, quantity, connection, linkType, menuService,
      personalization, unitMinor, grossMinor, taxMinor:tax(grossMinor, line.vatBasisPoints), vatBasisPoints:line.vatBasisPoints,
      productionType:line.productionType, withdrawal:withdrawalRule(line)};
  });
  const subtotalMinor = amount(items.reduce((sum, item) => sum + item.grossMinor, 0));
  const shippingMinor = amount(shipping.grossMinor);
  const shippingTaxMinor = tax(shippingMinor, shipping.vatBasisPoints);
  const totalMinor = amount(subtotalMinor + shippingMinor);
  const taxMinor = items.reduce((sum, item) => sum + item.taxMinor, shippingTaxMinor);
  const snapshot = {
    requestKey:order.requestKey, contact:order.contact, deliveryAddress:order.address, billing:order.billing,
    seller:{legalName:seller.legalName,address:seller.address,email:seller.email,phone:seller.phone,kep:seller.kep},
    items, shipping:{carrier:shipping.carrier,deliveryTerms:shipping.deliveryTerms,vatBasisPoints:shipping.vatBasisPoints,shippingMinor,shippingTaxMinor},
    totals:{currency:'TRY',subtotalMinor,shippingMinor,taxMinor,totalMinor},
    documents:Object.fromEntries(legalKeys.map(key => [key,{version:documents[key].version,text:documents[key].text}])),
  };
  return {snapshot, reviewId:await digest(snapshot)};
}

// Recompute the review from trusted data immediately before accepting it.
export function acceptCheckoutReview(review, approval) {
  if (approval?.reviewId !== review.reviewId || approval.preInformationConfirmed !== true || approval.distanceContractAccepted !== true) {
    throw new Error('Güncel ön bilgilendirme ve sözleşme onayı gerekli.');
  }
  return {reviewId:review.reviewId, snapshot:structuredClone(review.snapshot), acceptedAt:new Date().toISOString()};
}

const money = new Intl.NumberFormat('tr-TR', {style:'currency',currency:'TRY'});
const format = minor => money.format(minor / 100);

// Attachment body for an order email. The sender must use the saved record.
export function checkoutAttachment(record) {
  const {seller,contact,deliveryAddress,items,shipping,totals,documents} = record.snapshot;
  const itemLines = items.map(item => [
    `${item.productName} · ${item.quantity} adet · ${format(item.grossMinor)}`,
    `Okutma: ${({hybrid:'QR + NFC',qr:'Yalnız QR',nfc:'Yalnız NFC'})[item.connection]}. Bağlantı: ${item.linkType === 'dynamic' ? 'Değiştirilebilir' : 'Sabit'}.`,
    item.withdrawal === 'personalised_goods'
      ? 'Bu kalem kişiye özel kalıcı baskı olarak sipariş edilmiştir. Cayma istisnası ürünün yasal koşulları karşılamasına bağlıdır.'
      : 'Bu kalem için standart cayma koşulları uygulanır.',
  ].join('\n'));
  return [
    'NFCHane — Sipariş belgeleri',
    `Onay zamanı: ${record.acceptedAt}`,
    `Satıcı: ${seller.legalName}\n${seller.address}\n${seller.email} · ${seller.phone}\nKEP: ${seller.kep}`,
    `Alıcı: ${contact.name}\nTeslimat: ${deliveryAddress.line1}, ${deliveryAddress.district} / ${deliveryAddress.city}`,
    ...itemLines,
    'Ayıplı, yanlış, hasarlı veya çalışmayan ürünlerde tüketicinin yasal hakları saklıdır.',
    `Ürünler (vergiler dahil): ${format(totals.subtotalMinor)}\nKargo: ${format(totals.shippingMinor)}\nToplama dahil KDV: ${format(totals.taxMinor)}\nÖdenecek toplam: ${format(totals.totalMinor)}`,
    `${shipping.carrier}\n${shipping.deliveryTerms}`,
    `Ön bilgilendirme (${documents.preInformation.version})\n${documents.preInformation.text}`,
    `Mesafeli satış sözleşmesi (${documents.distanceContract.version})\n${documents.distanceContract.text}`,
  ].join('\n\n');
}
