export const baseCardMinor = 35000;
export const dynamicQrMinor = 5000;
export const dynamicQrChangeLimit = 3;

export function cardUnitMinor({connection,linkType}) {
  return baseCardMinor + (connection !== 'nfc' && linkType === 'dynamic' ? dynamicQrMinor : 0);
}

export function cardSubtotalMinor(items) {
  return items.reduce((sum,item)=>sum+cardUnitMinor(item)*item.quantity,0);
}

const formatter = new Intl.NumberFormat('tr-TR',{maximumFractionDigits:2});
export const formatCardPrice = minor => `${formatter.format(minor/100)} TL`;
