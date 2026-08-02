import type { ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import type { Permission } from '../types';

export function RequirePermission({ permission, children }: { permission: Permission; children: ReactNode }) {
  const { can } = usePermissions();

  if (!can(permission)) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate2-200 py-24 text-center dark:border-slate2-700">
        <ShieldAlert className="h-8 w-8 text-slate2-300" />
        <p className="font-display text-sm font-semibold text-slate2-700 dark:text-slate2-200">Access restricted</p>
        <p className="max-w-sm text-sm text-slate2-400">Your account doesn't have permission to view this page. Ask an administrator to grant access if you need it.</p>
      </div>
    );
  }

  return <>{children}</>;
}
