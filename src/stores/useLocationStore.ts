import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateId } from '../utils/id';
import type { Location } from '../types';
import { useNotificationStore } from './useNotificationStore';

interface LocationState {
  locations: Location[];
  ensureBootstrapLocations: () => void;
  add: (data: Omit<Location, 'id' | 'createdAt'>) => Location;
  update: (id: string, patch: Partial<Location>) => void;
  remove: (id: string) => boolean;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      locations: [],
      ensureBootstrapLocations: () => {
        if (get().locations.length > 0) return;
        const now = new Date().toISOString();
        const store: Location = { id: generateId('loc'), name: 'Store', type: 'store', address: 'Back-of-house warehouse', createdAt: now };
        const shop: Location = { id: generateId('loc'), name: 'Shop', type: 'shop', address: 'Retail sales floor', createdAt: now };
        set({ locations: [store, shop] });
      },
      add: (data) => {
        const location: Location = { ...data, id: generateId('loc'), createdAt: new Date().toISOString() };
        set((s) => ({ locations: [...s.locations, location] }));
        useNotificationStore.getState().push('success', 'Location added', `${location.name} was added.`);
        return location;
      },
      update: (id, patch) => set((s) => ({ locations: s.locations.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
      remove: (id) => {
        if (get().locations.length <= 1) {
          useNotificationStore.getState().push('error', "Can't remove", 'At least one location must remain.');
          return false;
        }
        set((s) => ({ locations: s.locations.filter((l) => l.id !== id) }));
        return true;
      }
    }),
    { name: 'Nova:v1:locations', storage: createJSONStorage(() => localStorage) }
  )
);
