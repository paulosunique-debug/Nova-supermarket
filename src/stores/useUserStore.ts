import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateId } from '../utils/id';
import type { Permission, User, UserRole } from '../types';
import { useNotificationStore } from './useNotificationStore';

export const DEFAULT_ADMIN_EMAIL = 'admin@store.local';
export const DEFAULT_ADMIN_PASSWORD = 'admin123';

interface UserState {
  users: User[];
  ensureBootstrapAdmin: () => void;
  add: (data: { name: string; email: string; password: string; role: UserRole; grantedPermissions?: Permission[]; revokedPermissions?: Permission[] }) => User;
  update: (id: string, patch: Partial<User>) => void;
  remove: (id: string) => void;
  setActive: (id: string, active: boolean) => void;
  findByCredentials: (email: string, password: string) => User | null;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      users: [],
      ensureBootstrapAdmin: () => {
        if (get().users.length > 0) return;
        const admin: User = {
          id: generateId('usr'),
          name: 'Administrator',
          email: DEFAULT_ADMIN_EMAIL,
          password: DEFAULT_ADMIN_PASSWORD,
          role: 'admin',
          grantedPermissions: [],
          revokedPermissions: [],
          active: true,
          avatarUrl: null,
          createdAt: new Date().toISOString()
        };
        set({ users: [admin] });
      },
      add: (data) => {
        const user: User = {
          id: generateId('usr'),
          name: data.name,
          email: data.email.trim().toLowerCase(),
          password: data.password,
          role: data.role,
          grantedPermissions: data.grantedPermissions ?? [],
          revokedPermissions: data.revokedPermissions ?? [],
          active: true,
          avatarUrl: null,
          createdAt: new Date().toISOString()
        };
        set((s) => ({ users: [...s.users, user] }));
        useNotificationStore.getState().push('success', 'User added', `${user.name} was added as ${user.role}.`);
        return user;
      },
      update: (id, patch) => set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) })),
      remove: (id) => {
        const admins = get().users.filter((u) => u.role === 'admin');
        const target = get().users.find((u) => u.id === id);
        if (target?.role === 'admin' && admins.length <= 1) {
          useNotificationStore.getState().push('error', "Can't remove", 'At least one admin account must remain.');
          return;
        }
        set((s) => ({ users: s.users.filter((u) => u.id !== id) }));
      },
      setActive: (id, active) => set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, active } : u)) })),
      findByCredentials: (email, password) => {
        const normalized = email.trim().toLowerCase();
        return get().users.find((u) => u.email === normalized && u.password === password && u.active) ?? null;
      }
    }),
    { name: 'Nova:v1:users', storage: createJSONStorage(() => localStorage) }
  )
);
