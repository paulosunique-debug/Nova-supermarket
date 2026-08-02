import { useMemo } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useUserStore } from '../stores/useUserStore';
import { effectivePermissions, hasPermission } from '../utils/permissions';
import type { Permission } from '../types';

export function usePermissions() {
  const currentUserId = useAuthStore((s) => s.currentUserId);
  const adminOverrideOriginalId = useAuthStore((s) => s.adminOverrideOriginalId);
  const users = useUserStore((s) => s.users);

  const currentUser = useMemo(() => users.find((u) => u.id === currentUserId) ?? null, [users, currentUserId]);
  const originalAdmin = useMemo(() => users.find((u) => u.id === adminOverrideOriginalId) ?? null, [users, adminOverrideOriginalId]);

  const permissions = useMemo(() => (currentUser ? effectivePermissions(currentUser) : new Set<Permission>()), [currentUser]);

  function can(permission: Permission): boolean {
    return hasPermission(currentUser, permission);
  }

  return {
    currentUser,
    permissions,
    can,
    isAdmin: currentUser?.role === 'admin',
    isPreviewing: !!originalAdmin,
    originalAdmin
  };
}
