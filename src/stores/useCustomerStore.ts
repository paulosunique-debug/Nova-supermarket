import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateId } from '../utils/id';
import type { Customer } from '../types';
import { useNotificationStore } from './useNotificationStore';

interface CustomerState {
  customers: Customer[];
  setAll: (customers: Customer[]) => void;
  add: (data: Omit<Customer, 'id' | 'createdAt' | 'rewardPoints' | 'debtBalance'>) => Customer;
  update: (id: string, patch: Partial<Customer>) => void;
  remove: (id: string) => void;
  addRewardPoints: (id: string, points: number) => void;
  adjustDebt: (id: string, amount: number) => void;
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: [],
      setAll: (customers) => set({ customers }),
      add: (data) => {
        const customer: Customer = {
          ...data,
          id: generateId('cus'),
          rewardPoints: 0,
          debtBalance: 0,
          createdAt: new Date().toISOString()
        };
        set((s) => ({ customers: [customer, ...s.customers] }));
        useNotificationStore.getState().push('success', 'Customer created', `${customer.name} was added.`);
        return customer;
      },
      update: (id, patch) => set((s) => ({ customers: s.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      remove: (id) => {
        const c = get().customers.find((x) => x.id === id);
        set((s) => ({ customers: s.customers.filter((x) => x.id !== id) }));
        if (c) useNotificationStore.getState().push('warning', 'Customer deleted', `${c.name} was removed.`);
      },
      addRewardPoints: (id, points) =>
        set((s) => ({ customers: s.customers.map((c) => (c.id === id ? { ...c, rewardPoints: c.rewardPoints + points } : c)) })),
      adjustDebt: (id, amount) =>
        set((s) => ({ customers: s.customers.map((c) => (c.id === id ? { ...c, debtBalance: c.debtBalance + amount } : c)) }))
    }),
    { name: 'Nova:v1:customers', storage: createJSONStorage(() => localStorage) }
  )
);
