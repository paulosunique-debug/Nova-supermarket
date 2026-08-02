import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateId } from '../utils/id';
import type { Sale } from '../types';
import { useNotificationStore } from './useNotificationStore';

interface SalesState {
  sales: Sale[];
  setAll: (sales: Sale[]) => void;
  addSale: (sale: Omit<Sale, 'id' | 'invoiceNumber' | 'createdAt'>) => Sale;
  refund: (id: string, full: boolean) => void;
}

const VALID_COUPONS: Record<string, { type: 'percent' | 'amount'; value: number }> = {
  SAVE10: { type: 'percent', value: 10 },
  SAVE5: { type: 'amount', value: 5 },
  WELCOME: { type: 'percent', value: 15 }
};

export function validateCoupon(code: string): { valid: boolean; type?: 'percent' | 'amount'; value?: number } {
  const found = VALID_COUPONS[code.trim().toUpperCase()];
  if (!found) return { valid: false };
  return { valid: true, ...found };
}

export const useSalesStore = create<SalesState>()(
  persist(
    (set, get) => ({
      sales: [],
      setAll: (sales) => set({ sales }),
      addSale: (data) => {
        const invoiceNumber = `INV-${100000 + get().sales.length}`;
        const sale: Sale = { ...data, id: generateId('sale'), invoiceNumber, createdAt: new Date().toISOString() };
        set((s) => ({ sales: [sale, ...s.sales] }));
        useNotificationStore.getState().push('success', 'Sale completed', `${invoiceNumber} — total charged successfully.`);
        return sale;
      },
      refund: (id, full) => {
        set((s) => ({
          sales: s.sales.map((sale) => (sale.id === id ? { ...sale, status: full ? 'refunded' : 'partially-refunded' } : sale))
        }));
        const sale = get().sales.find((s) => s.id === id);
        if (sale) useNotificationStore.getState().push('info', 'Refund processed', `${sale.invoiceNumber} was refunded.`);
      }
    }),
    { name: 'Nova:v1:sales', storage: createJSONStorage(() => localStorage) }
  )
);
