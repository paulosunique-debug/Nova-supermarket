const NAMESPACE = 'Nova:v1:';

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(NAMESPACE + key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(NAMESPACE + key, JSON.stringify(value));
    } catch {
      // storage full or unavailable — fail silently, app still works in-memory
    }
  },
  remove(key: string): void {
    localStorage.removeItem(NAMESPACE + key);
  },
  clearAll(): void {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(NAMESPACE))
      .forEach((k) => localStorage.removeItem(k));
  }
};

export const STORAGE_KEYS = {
  products: 'products',
  categories: 'categories',
  customers: 'customers',
  suppliers: 'suppliers',
  sales: 'sales',
  stockLogs: 'stockLogs',
  purchaseOrders: 'purchaseOrders',
  expenses: 'expenses',
  settings: 'settings',
  notifications: 'notifications',
  seeded: 'seeded'
} as const;
