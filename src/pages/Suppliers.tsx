import { useState } from 'react';
import { Plus, Search, Trash2, Pencil, Package } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Drawer } from '../components/ui/Drawer';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Badge } from '../components/ui/Badge';
import { DataTable, type DataTableColumn } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { useSupplierStore } from '../stores/useSupplierStore';
import { useProductStore } from '../stores/useProductStore';
import { usePurchaseOrderStore } from '../stores/usePurchaseOrderStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTranslation } from '../hooks/useTranslation';
import { useDebounce } from '../hooks/useDebounce';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';
import { totalStock } from '../utils/stock';
import type { Supplier } from '../types';

const emptyForm = { name: '', contactName: '', phone: '', email: '', address: '' };

export default function Suppliers() {
  const suppliers = useSupplierStore((s) => s.suppliers);
  const addSupplier = useSupplierStore((s) => s.add);
  const updateSupplier = useSupplierStore((s) => s.update);
  const removeSupplier = useSupplierStore((s) => s.remove);
  const products = useProductStore((s) => s.products);
  const orders = usePurchaseOrderStore((s) => s.orders);
  const symbol = useSettingsStore((s) => s.settings.currencySymbol);
  const { t } = useTranslation();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [profile, setProfile] = useState<Supplier | null>(null);

  const filtered = suppliers.filter((s) => !debouncedSearch || s.name.toLowerCase().includes(debouncedSearch.toLowerCase()));

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  }
  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({ name: s.name, contactName: s.contactName, phone: s.phone, email: s.email, address: s.address });
    setErrors({});
    setModalOpen(true);
  }
  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Supplier name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }
  function save() {
    if (!validate()) return;
    if (editing) updateSupplier(editing.id, form);
    else addSupplier(form);
    setModalOpen(false);
  }

  const columns: DataTableColumn<Supplier>[] = [
    { key: 'name', header: 'Supplier', sortable: true, render: (s) => <span className="font-medium text-ink dark:text-slate2-50">{s.name}</span> },
    { key: 'contactName', header: 'Contact' },
    { key: 'phone', header: 'Phone' },
    {
      key: 'productIds',
      header: 'Products',
      render: (s) => <Badge tone="market">{s.productIds.length}</Badge>
    },
    {
      key: 'balance',
      header: 'Balance',
      sortable: true,
      render: (s) => <span className={s.balance < 0 ? 'text-tomato-500' : 'text-market-600'}>{formatCurrency(s.balance, symbol)}</span>
    },
    {
      key: 'id',
      header: 'Actions',
      render: (s) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(s)}>
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
          <h1 className="font-display text-xl font-semibold text-ink dark:text-slate2-50">{t('suppliers_title')}</h1>
          <p className="text-sm text-slate2-400">{suppliers.length} {t('suppliers_subtitle')}</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> {t('suppliers_add')}
        </Button>
      </div>

      <Input placeholder={`${t('common_search')}…`} leftIcon={<Search className="h-4 w-4" />} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full max-w-xs" />

      {suppliers.length === 0 ? (
        <EmptyState title={t('suppliers_emptyTitle')} description={t('suppliers_emptyDesc')} actionLabel={t('suppliers_add')} onAction={openNew} />
      ) : (
        <DataTable columns={columns} data={filtered} pageSize={10} onRowClick={setProfile} />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('suppliers_edit') : t('suppliers_add')}
        size="sm"
        footer={
          <>
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setModalOpen(false)}>
              {t('common_cancel')}
            </Button>
            <Button className="flex-1 sm:flex-none" onClick={save}>{editing ? t('common_saveChanges') : t('suppliers_add')}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Input label={t('suppliers_name')} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={errors.name} />
          <Input label={t('suppliers_contactPerson')} value={form.contactName} onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))} />
          <Input label={t('customers_phone')} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <Input label={t('customers_email')} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <Input label={t('customers_address')} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        </div>
      </Modal>

      <Drawer open={!!profile} onClose={() => setProfile(null)} title={profile?.name}>
        {profile && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate2-50 p-3 dark:bg-slate2-900">
                <p className="text-xs text-slate2-400">{t('suppliers_balance')}</p>
                <p className="font-display text-lg font-semibold text-ink dark:text-slate2-50">{formatCurrency(profile.balance, symbol)}</p>
              </div>
              <div className="rounded-lg bg-slate2-50 p-3 dark:bg-slate2-900">
                <p className="text-xs text-slate2-400">{t('suppliers_productsSupplied')}</p>
                <p className="font-display text-lg font-semibold text-ink dark:text-slate2-50">{profile.productIds.length}</p>
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-slate2-400">{t('customers_contact')}</p>
              <p className="text-sm text-slate2-600 dark:text-slate2-300">{profile.contactName}</p>
              <p className="text-sm text-slate2-600 dark:text-slate2-300">{profile.phone}</p>
              <p className="text-sm text-slate2-600 dark:text-slate2-300">{profile.email}</p>
              <p className="text-sm text-slate2-600 dark:text-slate2-300">{profile.address}</p>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-slate2-400">{t('suppliers_productsSupplied')}</p>
              <div className="flex flex-col gap-2">
                {products.filter((p) => p.supplierId === profile.id).map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate2-100 px-3 py-2 dark:border-slate2-700">
                    <div className="flex items-center gap-2">
                      <Package className="h-3.5 w-3.5 text-slate2-400" />
                      <span className="text-sm text-ink dark:text-slate2-50">{p.name}</span>
                    </div>
                    <span className="text-xs text-slate2-400">{totalStock(p)} {p.unit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-slate2-400">{t('suppliers_purchaseOrders')}</p>
              <div className="flex flex-col gap-2">
                {orders.filter((o) => o.supplierId === profile.id).length === 0 && <p className="text-sm text-slate2-400">No purchase orders yet.</p>}
                {orders
                  .filter((o) => o.supplierId === profile.id)
                  .map((o) => (
                    <div key={o.id} className="flex items-center justify-between rounded-lg border border-slate2-100 px-3 py-2 dark:border-slate2-700">
                      <div>
                        <p className="text-sm font-medium text-ink dark:text-slate2-50">{o.poNumber}</p>
                        <p className="text-xs text-slate2-400">{formatDate(o.createdAt)}</p>
                      </div>
                      <Badge tone={o.status === 'delivered' ? 'market' : o.status === 'cancelled' ? 'tomato' : 'citrus'}>{o.status}</Badge>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && removeSupplier(deleteTarget.id)}
        title="Delete this supplier?"
        description={`"${deleteTarget?.name}" will be removed from your supplier list.`}
      />
    </div>
  );
}
