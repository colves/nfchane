import { responsiveImage } from './responsive-image.js';
const methods = { hybrid: 'qr-nfc', nfc: 'nfc', qr: 'qr' };
const names = { hybrid: 'QR ve NFC', nfc: 'yalnız NFC', qr: 'yalnız QR' };

export function menuCardAsset(connection = 'hybrid', material = 'clear', base = './') {
  if (!methods[connection] || material !== 'clear') throw new Error('Geçersiz kart görseli seçimi');
  return `${base}images/menu/menu-seffaf-${methods[connection]}-v1.webp`;
}

export function menuCardImage(connection = 'hybrid', material = 'clear', base = './', options = {}) {
  return responsiveImage(menuCardAsset(connection, material, base), `Dijital menü kartı, şeffaf pleksi, ${names[connection]}`, { ...options, className: 'google-product-image menu-product-image' });
}
