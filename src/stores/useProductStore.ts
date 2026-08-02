import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateId, generateBarcode, generateSKU } from '../utils/id';
import type { Product } from '../types';
import { totalStock } from '../utils/stock';
import { useStockLogStore } from './useStockLogStore';
import { useNotificationStore } from './useNotificationStore';

export type NewProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'sku' | 'barcode'> & {
  sku?: string;
  barcode?: string;
};

interface ProductState {
  products: Product[];
  setAll: (products: Product[]) => void;
  add: (data: NewProductInput) => Product;
  update: (id: string, patch: Partial<Product>) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => Product | null;
  receiveStock: (id: string, locationId: string, qty: number, reason?: string, reference?: string) => void;
  adjustStock: (id: string, locationId: string, qty: number, direction: 'increase' | 'decrease', reason?: string) => void;
  decreaseForSale: (id: string, locationId: string, qty: number, reference: string) => void;
  transfer: (id: string, fromLocationId: string, toLocationId: string, qty: number, reason?: string) => boolean;
}

function setLocationStock(product: Product, locationId: string, value: number): Record<string, number> {
  return { ...product.stockByLocation, [locationId]: Math.max(0, value) };
}

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: [],
      setAll: (products) => set({ products }),
      add: (data) => {
        const now = new Date().toISOString();
        const product: Product = {
          ...data,
          id: generateId('prod'),
          sku: data.sku || generateSKU(data.name),
          barcode: data.barcode || generateBarcode(),
          createdAt: now,
          updatedAt: now
        };
        set((s) => ({ products: [product, ...s.products] }));
        Object.entries(product.stockByLocation).forEach(([locationId, qty]) => {
          if (qty > 0) {
            useStockLogStore.getState().addLog({
              productId: product.id,
              locationId,
              type: 'initial',
              quantity: qty,
              reason: 'Product created',
              resultingStock: qty
            });
          }
        });
        useNotificationStore.getState().push('success', 'Product added', `${product.name} was added to the catalog.`);
        if (totalStock(product) <= product.reorderLevel) {
          useNotificationStore.getState().push('warning', 'Low stock', `${product.name} is at or below its reorder level.`);
        }
        return product;
      },
      update: (id, patch) => {
        set((s) => ({
          products: s.products.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p))
        }));
        const p = get().products.find((x) => x.id === id);
        if (p) useNotificationStore.getState().push('info', 'Product updated', `${p.name} was updated.`);
      },
      remove: (id) => {
        const p = get().products.find((x) => x.id === id);
        set((s) => ({ products: s.products.filter((x) => x.id !== id) }));
        if (p) useNotificationStore.getState().push('warning', 'Product deleted', `${p.name} was removed from the catalog.`);
      },
      duplicate: (id) => {
        const original = get().products.find((x) => x.id === id);
        if (!original) return null;
        const now = new Date().toISOString();
        const copy: Product = {
          ...original,
          id: generateId('prod'),
          name: `${original.name} (Copy)`,
          sku: generateSKU(original.name),
          barcode: generateBarcode(),
          createdAt: now,
          updatedAt: now
        };
        set((s) => ({ products: [copy, ...s.products] }));
        useNotificationStore.getState().push('success', 'Product duplicated', `Created a copy of ${original.name}.`);
        return copy;
      },
      receiveStock: (id, locationId, qty, reason, reference) => {
        const p = get().products.find((x) => x.id === id);
        if (!p) return;
        const resultingStock = (p.stockByLocation[locationId] ?? 0) + qty;
        get().update(id, { stockByLocation: setLocationStock(p, locationId, resultingStock) });
        useStockLogStore.getState().addLog({ productId: id, locationId, type: 'receive', quantity: qty, reason, reference, resultingStock });
      },
      adjustStock: (id, locationId, qty, direction, reason) => {
        const p = get().products.find((x) => x.id === id);
        if (!p) return;
        const delta = direction === 'increase' ? qty : -qty;
        const resultingStock = Math.max(0, (p.stockByLocation[locationId] ?? 0) + delta);
        get().update(id, { stockByLocation: setLocationStock(p, locationId, resultingStock) });
        useStockLogStore.getState().addLog({
          productId: id,
          locationId,
          type: direction === 'increase' ? 'adjust-increase' : 'adjust-decrease',
          quantity: delta,
          reason,
          resultingStock
        });
        const updated = get().products.find((x) => x.id === id)!;
        if (totalStock(updated) <= updated.reorderLevel) {
          useNotificationStore.getState().push('warning', 'Low stock', `${p.name} total stock is now ${totalStock(updated)} units.`);
        }
      },
      decreaseForSale: (id, locationId, qty, reference) => {
        const p = get().products.find((x) => x.id === id);
        if (!p) return;
        const resultingStock = Math.max(0, (p.stockByLocation[locationId] ?? 0) - qty);
        const stockByLocation = setLocationStock(p, locationId, resultingStock);
        set((s) => ({ products: s.products.map((x) => (x.id === id ? { ...x, stockByLocation } : x)) }));
        useStockLogStore.getState().addLog({ productId: id, locationId, type: 'sale', quantity: -qty, reference, resultingStock });
        const updated = { ...p, stockByLocation };
        if (totalStock(updated) <= updated.reorderLevel) {
          useNotificationStore.getState().push('warning', 'Low stock', `${p.name} is running low (${totalStock(updated)} left total).`);
        }
      },
      transfer: (id, fromLocationId, toLocationId, qty, reason) => {
        const p = get().products.find((x) => x.id === id);
        if (!p) return false;
        const fromStock = p.stockByLocation[fromLocationId] ?? 0;
        if (fromStock < qty) {
          useNotificationStore.getState().push('error', 'Transfer failed', `Not enough stock of ${p.name} at the source location.`);
          return false;
        }
        const resultingFrom = fromStock - qty;
        const resultingTo = (p.stockByLocation[toLocationId] ?? 0) + qty;
        const stockByLocation = { ...p.stockByLocation, [fromLocationId]: resultingFrom, [toLocationId]: resultingTo };
        get().update(id, { stockByLocation });
        useStockLogStore.getState().addLog({ productId: id, locationId: fromLocationId, type: 'transfer-out', quantity: -qty, reason, resultingStock: resultingFrom });
        useStockLogStore.getState().addLog({ productId: id, locationId: toLocationId, type: 'transfer-in', quantity: qty, reason, resultingStock: resultingTo });
        return true;
      }
    }),
    { name: 'Nova:v1:products', storage: createJSONStorage(() => localStorage) }
  )
);
