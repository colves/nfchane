const methods = new Set(['hybrid', 'nfc', 'qr']);

export function previewEvent(type, productId, selection) {
  if (productId !== 'google') return null;
  const detail = { type, productId, mode: 'preview' };
  if (type === 'product_view') return detail;
  if (type !== 'cart_add' || !methods.has(selection?.connection) ||
      !Number.isInteger(selection.quantity) || selection.quantity < 1 || selection.quantity > 1000) return null;
  return { ...detail, method: selection.connection, quantity: selection.quantity };
}

export function emitPreviewEvent(type, productId, selection) {
  const detail = previewEvent(type, productId, selection);
  if (detail) window.dispatchEvent(new CustomEvent('nfchane:storefront', { detail }));
}
