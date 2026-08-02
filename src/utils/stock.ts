import type { Product } from '../types';

export function totalStock(product: Product): number {
  return Object.values(product.stockByLocation ?? {}).reduce((sum, n) => sum + n, 0);
}

export function stockAt(product: Product, locationId: string): number {
  return product.stockByLocation?.[locationId] ?? 0;
}
