// Assemble the manual e-Portal checklist from persisted, server-side order records.
export function prepareInvoiceRecord({order, review, payment, shipment, invoice}) {
  const checkout = review?.snapshot;
  if (!checkout || !payment || order.is_test || payment.is_test !== false ||
      !['paid','preparing','shipped','delivered'].includes(order.status) ||
      payment.order_id !== order.id || review.order_id !== order.id ||
      payment.amount_minor !== checkout.totals.totalMinor || payment.amount_minor !== order.total_minor ||
      payment.currency !== checkout.totals.currency || payment.method !== 'card' || !payment.verified_at) {
    throw new Error('Doğrulanmış ödeme ve sipariş bilgileri gerekli.');
  }
  return {
    lookupRecipientStatus: true,
    requestedDocumentType: invoice?.document_type ?? null,
    recipient: checkout.billing,
    address: checkout.billing.address ?? checkout.deliveryAddress,
    items: checkout.items.map(({productName,quantity,unitMinor,vatBasisPoints}) => ({productName,quantity,unitMinor,vatBasisPoints})),
    totals: checkout.totals,
    website: 'https://nfchane.com/',
    paymentDate: payment.verified_at,
    paymentMethod: payment.method,
    carrier: shipment?.carrier_name ?? null,
    trackingNumber: shipment?.tracking_number ?? null,
    shipmentDate: shipment?.shipped_at ?? null,
    documentNumber: invoice?.invoice_number ?? null,
    documentDate: invoice?.issued_at ?? null,
    privateDocumentPath: invoice?.private_document_path ?? null,
  };
}
