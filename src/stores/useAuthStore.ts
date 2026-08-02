import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useUserStore } from './useUserStore';
import { useNotificationStore } from './useNotificationStore';

interface AuthState {
  currentUserId: string | null;
  adminOverrideOriginalId: string | null; // set when an admin is previewing another role
  login: (email: string, password: string) => boolean;
  logout: () => void;
  switchTo: (userId: string) => void;
  returnToAdmin: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUserId: null,
      adminOverrideOriginalId: null,
      login: (email, password) => {
        const user = useUserStore.getState().findByCredentials(email, password);
        if (!user) return false;
        set({ currentUserId: user.id, adminOverrideOriginalId: null });
        useNotificationStore.getState().push('success', 'Welcome back', `Signed in as ${user.name}.`);
        return true;
      },
      logout: () => set({ currentUserId: null, adminOverrideOriginalId: null }),
      switchTo: (userId) => {
        const current = get().currentUserId;
        set({ currentUserId: userId, adminOverrideOriginalId: get().adminOverrideOriginalId ?? current });
        const user = useUserStore.getState().users.find((u) => u.id === userId);
        if (user) useNotificationStore.getState().push('info', 'Switched user', `Now previewing as ${user.name} (${user.role}).`);
      },
      returnToAdmin: () => {
        const originalId = get().adminOverrideOriginalId;
        if (originalId) set({ currentUserId: originalId, adminOverrideOriginalId: null });
      }
    }),
    { name: 'Nova:v1:auth', storage: createJSONStorage(() => localStorage) }
  )
);
