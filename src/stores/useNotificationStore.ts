import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateId } from '../utils/id';
import type { AppNotification, NotificationType } from '../types';

interface ToastItem extends AppNotification {}

interface NotificationState {
  notifications: AppNotification[];
  toasts: ToastItem[];
  push: (type: NotificationType, title: string, message: string) => void;
  dismissToast: (id: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      toasts: [],
      push: (type, title, message) => {
        const n: AppNotification = {
          id: generateId('ntf'),
          type,
          title,
          message,
          read: false,
          createdAt: new Date().toISOString()
        };
        set((s) => ({
          notifications: [n, ...s.notifications].slice(0, 200),
          toasts: [...s.toasts, n]
        }));
        setTimeout(() => get().dismissToast(n.id), 4500);
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      markRead: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      clearAll: () => set({ notifications: [] })
    }),
    { name: 'Nova:v1:notifications', storage: createJSONStorage(() => localStorage), partialize: (s) => ({ notifications: s.notifications, toasts: [] }) as any }
  )
);
