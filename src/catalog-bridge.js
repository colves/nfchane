const publicTextFields = ['name','description','label','headline','subtitle'];

export function validateCatalogRows(rows, expectedIds) {
  if (!Array.isArray(rows) || rows.length !== expectedIds.length) throw new Error('Catalog count mismatch');
  const ids = new Set();
  for (const row of rows) {
    if (!expectedIds.includes(row.id) || ids.has(row.id)) throw new Error('Catalog identity mismatch');
    ids.add(row.id);
    // Existing renderers accept plain text. Reject markup/attribute metacharacters until
    // all content fields have a dedicated escaping/rendering contract.
    for (const field of publicTextFields) {
      if (typeof row[field] !== 'string' || !row[field].trim() || row[field].length > 2000 || /[<>"&\u0000-\u001f]/.test(row[field])) throw new Error('Invalid public catalog text');
    }
    if (row.price_minor !== null && (!Number.isSafeInteger(row.price_minor) || row.price_minor < 0)) throw new Error('Invalid catalog price');
    if (row.currency !== 'TRY' || row.is_purchasable !== false) throw new Error('Preview sales must remain disabled');
  }
  return rows;
}

export function applyCatalogSnapshot(products, snapshot) {
  if (!snapshot.length) return;
  validateCatalogRows(snapshot, products.map(product => product.id));
  for (const product of products) {
    const row = snapshot.find(row => row.id === product.id);
    for (const field of publicTextFields) product[field] = row[field];
    // Catalog prices are stored for future checkout. Preview always shows no price.
    product.price = null;
  }
}
