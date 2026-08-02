import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, ShieldCheck, UserCog } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Badge } from '../components/ui/Badge';
import { Switch } from '../components/ui/Switch';
import { DataTable, type DataTableColumn } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { useUserStore } from '../stores/useUserStore';
import { useAuthStore } from '../stores/useAuthStore';
import { usePermissions } from '../hooks/usePermissions';
import { useDebounce } from '../hooks/useDebounce';
import { ROLE_DEFAULT_PERMISSIONS, ROLE_LABELS, PERMISSION_GROUPS, effectivePermissions } from '../utils/permissions';
import { formatDate } from '../utils/date';
import type { Permission, User, UserRole } from '../types';

const ROLES: UserRole[] = ['admin', 'manager', 'finance', 'cashier', 'inventory_clerk'];

const emptyForm = { name: '', email: '', password: '', role: 'cashier' as UserRole };

export default function Users() {
  const users = useUserStore((s) => s.users);
  const addUser = useUserStore((s) => s.add);
  const updateUser = useUserStore((s) => s.update);
  const removeUser = useUserStore((s) => s.remove);
  const setActive = useUserStore((s) => s.setActive);
  const { currentUser } = usePermissions();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [overrides, setOverrides] = useState<{ granted: Permission[]; revoked: Permission[] }>({ granted: [], revoked: [] });
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const filtered = users.filter((u) => !debouncedSearch || u.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || u.email.toLowerCase().includes(debouncedSearch.toLowerCase()));

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setOverrides({ granted: [], revoked: [] });
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(u: User) {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setOverrides({ granted: [...u.grantedPermissions], revoked: [...u.revokedPermissions] });
    setErrors({});
    setModalOpen(true);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!editing && form.password.length < 4) errs.password = 'Password must be at least 4 characters';
    const emailTaken = users.some((u) => u.email.toLowerCase() === form.email.trim().toLowerCase() && u.id !== editing?.id);
    if (emailTaken) errs.email = 'That email is already in use';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function save() {
    if (!validate()) return;
    if (editing) {
      updateUser(editing.id, {
        name: form.name,
        email: form.email.trim().toLowerCase(),
        role: form.role,
        grantedPermissions: overrides.granted,
        revokedPermissions: overrides.revoked,
        ...(form.password ? { password: form.password } : {})
      });
    } else {
      addUser({ name: form.name, email: form.email, password: form.password, role: form.role, grantedPermissions: overrides.granted, revokedPermissions: overrides.revoked });
    }
    setModalOpen(false);
  }

  function togglePermission(p: Permission) {
    const isDefault = ROLE_DEFAULT_PERMISSIONS[form.role].includes(p);
    setOverrides((prev) => {
      const granted = new Set(prev.granted);
      const revoked = new Set(prev.revoked);
      const currentlyOn = isDefault ? !revoked.has(p) : granted.has(p);
      if (currentlyOn) {
        // turning off
        granted.delete(p);
        if (isDefault) revoked.add(p);
      } else {
        // turning on
        revoked.delete(p);
        if (!isDefault) granted.add(p);
      }
      return { granted: Array.from(granted), revoked: Array.from(revoked) };
    });
  }

  const columns: DataTableColumn<User>[] = [
    {
      key: 'name',
      header: 'User',
      sortable: true,
      render: (u) => (
        <div>
          <p className="font-medium text-ink dark:text-slate2-50">{u.name}</p>
          <p className="text-xs text-slate2-400">{u.email}</p>
        </div>
      )
    },
    { key: 'role', header: 'Role', sortable: true, render: (u) => <Badge tone="market">{ROLE_LABELS[u.role]}</Badge> },
    {
      key: 'grantedPermissions',
      header: 'Permissions',
      render: (u) => <span className="text-xs text-slate2-400">{effectivePermissions(u).size} granted</span>
    },
    { key: 'active', header: 'Status', render: (u) => <Badge tone={u.active ? 'market' : 'tomato'}>{u.active ? 'Active' : 'Disabled'}</Badge> },
    { key: 'createdAt', header: 'Added', render: (u) => formatDate(u.createdAt) },
    {
      key: 'id',
      header: 'Actions',
      render: (u) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => openEdit(u)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setActive(u.id, !u.active)} disabled={u.id === currentUser?.id}>
            <UserCog className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(u)} disabled={u.id === currentUser?.id}>
            <Trash2 className="h-3.5 w-3.5 text-tomato-500" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink dark:text-slate2-50">Users & Permissions</h1>
          <p className="text-sm text-slate2-400">{users.length} accounts with access to this store.</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      <Input placeholder="Search users…" leftIcon={<Search className="h-4 w-4" />} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full max-w-xs" />

      {users.length === 0 ? (
        <EmptyState icon={<ShieldCheck className="h-8 w-8" />} title="No users yet" description="Add your first team account." actionLabel="Add User" onAction={openNew} />
      ) : (
        <DataTable columns={columns} data={filtered} pageSize={10} onRowClick={openEdit} />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit User' : 'Add User'}
        size="lg"
        footer={
          <>
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1 sm:flex-none" onClick={save}>
              {editing ? 'Save Changes' : 'Add User'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Full Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={errors.name} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} error={errors.email} />
          <Input
            label={editing ? 'New Password (leave blank to keep current)' : 'Password'}
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            error={errors.password}
          />
          <Select label="Role" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))} options={ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))} />
        </div>

        <div className="mt-5">
          <p className="mb-1 text-sm font-medium text-slate2-700 dark:text-slate2-200">Custom Privileges & Permissions</p>
          <p className="mb-3 text-xs text-slate2-400">Toggles start from the {ROLE_LABELS[form.role]} role's defaults — flip any switch to grant or revoke that specific permission for this user only.</p>
          <div className="flex flex-col gap-4">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-2 text-xs font-semibold uppercase text-slate2-400">{group.label}</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {group.permissions.map((p) => {
                    const isDefault = ROLE_DEFAULT_PERMISSIONS[form.role].includes(p);
                    const on = isDefault ? !overrides.revoked.includes(p) : overrides.granted.includes(p);
                    return (
                      <Switch key={p} checked={on} onChange={() => togglePermission(p)} label={p} />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => deleteTarget && removeUser(deleteTarget.id)} title="Delete this user?" description={`"${deleteTarget?.name}" will lose access immediately.`} />
    </div>
  );
}
