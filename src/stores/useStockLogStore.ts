import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateId } from '../utils/id';
import type { StockLogEntry } from '../types';

interface StockLogState {
  logs: StockLogEntry[];
  setAll: (logs: StockLogEntry[]) => void;
  addLog: (entry: Omit<StockLogEntry, 'id' | 'createdAt'>) => void;
}

export const useStockLogStore = create<StockLogState>()(
  persist(
    (set) => ({
      logs: [],
      setAll: (logs) => set({ logs }),
      addLog: (entry) =>
        set((s) => ({
          logs: [{ ...entry, id: generateId('log'), createdAt: new Date().toISOString() }, ...s.logs].slice(0, 5000)
        }))
    }),
    { name: 'Nova:v1:stockLogs', storage: createJSONStorage(() => localStorage) }
  )
);
