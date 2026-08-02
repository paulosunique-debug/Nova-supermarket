import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StoreSettings } from '../types';
import { getCurrencySymbol } from '../utils/currency';

const defaultSettings: StoreSettings = {
  storeName: 'Nova Super-Market',
  logoUrl: null,
  currency: 'ETB',
  currencySymbol: 'Br',
  language: 'English',
  defaultTaxRate: 8,
  receiptFooter: 'Thank you for shopping with us!',
  theme: 'light',
  notificationsEnabled: true
};

interface SettingsState {
  settings: StoreSettings;
  update: (patch: Partial<StoreSettings>) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      update: (patch) =>
        set((s) => {
          const next = { ...s.settings, ...patch };
          // keep currency symbol in sync with currency + language selection
          next.currencySymbol = getCurrencySymbol(next.currency, next.language);
          return { settings: next };
        }),
      reset: () => set({ settings: defaultSettings })
    }),
    { name: 'Nova:v1:settings', storage: createJSONStorage(() => localStorage) }
  )
);
