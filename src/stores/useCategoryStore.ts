import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateId } from '../utils/id';
import type { Category } from '../types';

interface CategoryState {
  categories: Category[];
  setAll: (cats: Category[]) => void;
  add: (data: Omit<Category, 'id' | 'createdAt'>) => Category;
  update: (id: string, patch: Partial<Category>) => void;
  remove: (id: string) => void;
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set, get) => ({
      categories: [],
      setAll: (categories) => set({ categories }),
      add: (data) => {
        const cat: Category = { ...data, id: generateId('cat'), createdAt: new Date().toISOString() };
        set((s) => ({ categories: [...s.categories, cat] }));
        return cat;
      },
      update: (id, patch) =>
        set((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      remove: (id) => set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }))
    }),
    { name: 'Nova:v1:categories', storage: createJSONStorage(() => localStorage) }
  )
);
