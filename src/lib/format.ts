import type { Price } from '../config/types.ts';

const number = new Intl.NumberFormat('ru-RU');

export function formatPrice(price: Price): string {
  return [price.prefix, `${number.format(price.amount)} ${price.currency}`].filter(Boolean).join(' ');
}
