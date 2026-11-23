import test from 'node:test';
import assert from 'node:assert/strict';
import { previewEvent } from '../src/storefront-events.js';

test('the pilot emits preview fields only and has no browser payment events', () => {
  assert.deepEqual(previewEvent('product_view', 'google'), {
    type: 'product_view', productId: 'google', mode: 'preview',
  });
  assert.deepEqual(previewEvent('cart_add', 'google', {
    connection: 'hybrid', quantity: 2, email: 'test@example.invalid', targetUrl: 'https://example.invalid',
  }), { type: 'cart_add', productId: 'google', mode: 'preview', method: 'hybrid', quantity: 2 });
  assert.equal(previewEvent('cart_add', 'google', { connection: 'qr', quantity: '2' }), null);
  assert.equal(previewEvent('checkout_start', 'google'), null);
  assert.equal(previewEvent('purchase', 'google'), null);
});
