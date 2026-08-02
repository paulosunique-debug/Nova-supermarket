import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateId } from '../utils/id';
import type { Supplier } from '../types';
import { useNotificationStore } from './useNotificationStore';

interface SupplierState {
  suppliers: Supplier[];
  setAll: (suppliers: Supplier[]) => void;
  add: (data: Omit<Supplier, 'id' | 'createdAt' | 'productIds' | 'balance'>) => Supplier;
  update: (id: string, patch: Partial<Supplier>) => void;
  remove: (id: string) => void;
  adjustBalance: (id: string, amount: number) => void;
}

export const useSupplierStore = create<SupplierState>()(
  persist(
    (set, get) => ({
      suppliers: [],
      setAll: (suppliers) => set({ suppliers }),
      add: (data) => {
        const supplier: Supplier = { ...data, id: generateId('sup'), productIds: [], balance: 0, createdAt: new Date().toISOString() };
        set((s) => ({ suppliers: [supplier, ...s.suppliers] }));
        useNotificationStore.getState().push('success', 'Supplier added', `${supplier.name} was added.`);
        return supplier;
      },
      update: (id, patch) => set((s) => ({ suppliers: s.suppliers.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      remove: (id) => {
        const s0 = get().suppliers.find((x) => x.id === id);
        set((s) => ({ suppliers: s.suppliers.filter((x) => x.id !== id) }));
        if (s0) useNotificationStore.getState().push('warning', 'Supplier deleted', `${s0.name} was removed.`);
      },
      adjustBalance: (id, amount) =>
        set((s) => ({ suppliers: s.suppliers.map((x) => (x.id === id ? { ...x, balance: x.balance + amount } : x)) }))
    }),
    { name: 'Nova:v1:suppliers', storage: createJSONStorage(() => localStorage) }
  )
);
