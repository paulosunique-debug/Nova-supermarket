import type { Permission, User, UserRole } from '../types';

export const ALL_PERMISSIONS: Permission[] = [
  'dashboard.view',
  'pos.use',
  'products.view',
  'products.manage',
  'categories.manage',
  'inventory.manage',
  'transfers.manage',
  'locations.manage',
  'customers.manage',
  'suppliers.manage',
  'purchaseOrders.manage',
  'purchaseOrders.approve',
  'salesHistory.view',
  'salesHistory.refund',
  'expenses.manage',
  'expenses.approve',
  'reports.view',
  'analytics.view',
  'finance.view',
  'settings.manage',
  'users.manage'
];

export const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = [
  { label: 'Dashboard & Analytics', permissions: ['dashboard.view', 'reports.view', 'analytics.view'] },
  { label: 'Point of Sale', permissions: ['pos.use', 'salesHistory.view', 'salesHistory.refund'] },
  { label: 'Catalog', permissions: ['products.view', 'products.manage', 'categories.manage'] },
  { label: 'Inventory & Locations', permissions: ['inventory.manage', 'transfers.manage', 'locations.manage'] },
  { label: 'People', permissions: ['customers.manage', 'suppliers.manage'] },
  { label: 'Purchasing', permissions: ['purchaseOrders.manage', 'purchaseOrders.approve'] },
  { label: 'Finance', permissions: ['finance.view', 'expenses.manage', 'expenses.approve'] },
  { label: 'Administration', permissions: ['settings.manage', 'users.manage'] }
];

export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [...ALL_PERMISSIONS],
  manager: [
    'dashboard.view',
    'pos.use',
    'products.view',
    'products.manage',
    'categories.manage',
    'inventory.manage',
    'transfers.manage',
    'locations.manage',
    'customers.manage',
    'suppliers.manage',
    'purchaseOrders.manage',
    'salesHistory.view',
    'salesHistory.refund',
    'reports.view',
    'analytics.view'
  ],
  finance: ['dashboard.view', 'reports.view', 'analytics.view', 'finance.view', 'expenses.manage', 'expenses.approve', 'purchaseOrders.approve', 'salesHistory.view'],
  cashier: ['dashboard.view', 'pos.use', 'products.view', 'salesHistory.view', 'customers.manage'],
  inventory_clerk: ['dashboard.view', 'products.view', 'products.manage', 'categories.manage', 'inventory.manage', 'transfers.manage', 'locations.manage', 'suppliers.manage', 'purchaseOrders.manage']
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  finance: 'Finance',
  cashier: 'Cashier',
  inventory_clerk: 'Inventory Clerk'
};

export function effectivePermissions(user: User): Set<Permission> {
  const base = new Set(ROLE_DEFAULT_PERMISSIONS[user.role] ?? []);
  user.grantedPermissions.forEach((p) => base.add(p));
  user.revokedPermissions.forEach((p) => base.delete(p));
  return base;
}

export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false;
  if (!user.active) return false;
  return effectivePermissions(user).has(permission);
}
