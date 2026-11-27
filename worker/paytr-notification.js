const encoder = new TextEncoder();

export async function authenticatePaytrNotification(fields, {key, salt} = {}) {
  if (!key || !salt) return false;
  const {merchant_oid:reference,status,total_amount:total,hash} = fields;
  if (typeof reference !== 'string' || !/^[A-Za-z0-9]{1,64}$/.test(reference)
      || !['success','failed'].includes(status) || !/^\d{1,10}$/.test(total)
      || typeof hash !== 'string' || !/^[A-Za-z0-9+/]{43}=$/.test(hash)) return null;

  const hmacKey = await crypto.subtle.importKey('raw',encoder.encode(key),{name:'HMAC',hash:'SHA-256'},false,['verify']);
  return crypto.subtle.verify('HMAC',hmacKey,Uint8Array.from(atob(hash),c=>c.charCodeAt(0)),
    encoder.encode(reference + salt + status + total));
}

// Call only after authenticating the signed fields.
export function matchPaytrNotification(fields, attempt) {
  const {merchant_oid:reference,status,total_amount:total} = fields;
  if (!attempt || reference !== attempt.reference) return null;
  if (status === 'failed') return {reference,status};
  if (attempt.currency !== 'TRY' || attempt.installments !== false || Number(total) !== attempt.amountMinor
      || !Number.isSafeInteger(attempt.amountMinor) || attempt.amountMinor <= 0
      || fields.currency !== 'TL' || fields.payment_type !== 'card'
      || fields.payment_amount !== String(attempt.amountMinor)
      || (attempt.test ? fields.test_mode !== '1' : ![undefined,'0'].includes(fields.test_mode))) return null;
  return {reference,status,amountMinor:attempt.amountMinor,currency:attempt.currency,test:attempt.test === true};
}

export async function verifyPaytrNotification(fields, attempt, credentials) {
  return await authenticatePaytrNotification(fields,credentials) ? matchPaytrNotification(fields,attempt) : null;
}
