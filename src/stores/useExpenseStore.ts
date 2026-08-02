import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateId } from '../utils/id';
import type { Expense } from '../types';
import { useNotificationStore } from './useNotificationStore';

interface ExpenseState {
  expenses: Expense[];
  setAll: (expenses: Expense[]) => void;
  add: (data: Omit<Expense, 'id' | 'createdAt' | 'approvalStatus' | 'approvedBy'>, autoApprove: boolean) => Expense;
  update: (id: string, patch: Partial<Expense>) => void;
  remove: (id: string) => void;
  approve: (id: string, approverId: string) => void;
  reject: (id: string, approverId: string) => void;
}

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      expenses: [],
      setAll: (expenses) => set({ expenses }),
      add: (data, autoApprove) => {
        const expense: Expense = {
          ...data,
          id: generateId('exp'),
          approvalStatus: autoApprove ? 'approved' : 'pending',
          approvedBy: null,
          createdAt: new Date().toISOString()
        };
        set((s) => ({ expenses: [expense, ...s.expenses] }));
        useNotificationStore
          .getState()
          .push('success', 'Expense recorded', autoApprove ? `${expense.title} was recorded and approved.` : `${expense.title} was submitted for finance approval.`);
        return expense;
      },
      update: (id, patch) => set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      remove: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),
      approve: (id, approverId) => {
        set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? { ...e, approvalStatus: 'approved', approvedBy: approverId } : e)) }));
        const e = get().expenses.find((x) => x.id === id);
        if (e) useNotificationStore.getState().push('success', 'Expense approved', `${e.title} was approved.`);
      },
      reject: (id, approverId) => {
        set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? { ...e, approvalStatus: 'rejected', approvedBy: approverId } : e)) }));
        const e = get().expenses.find((x) => x.id === id);
        if (e) useNotificationStore.getState().push('warning', 'Expense rejected', `${e.title} was rejected.`);
      }
    }),
    { name: 'Nova:v1:expenses', storage: createJSONStorage(() => localStorage) }
  )
);
