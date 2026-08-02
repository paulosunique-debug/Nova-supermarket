import { useMemo, useState } from 'react';
import { Plus, Search, Trash2, Pencil, Star, Wallet } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Modal } from '../components/ui/Modal';
import { Drawer } from '../components/ui/Drawer';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Badge } from '../components/ui/Badge';
import { DataTable, type DataTableColumn } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { useCustomerStore } from '../stores/useCustomerStore';
import { useSalesStore } from '../stores/useSalesStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTranslation } from '../hooks/useTranslation';
import { useDebounce } from '../hooks/useDebounce';
import { formatCurrency } from '../utils/currency';
import { formatDate, formatDateTime } from '../utils/date';
import type { Customer } from '../types';

const emptyForm = { name: '', phone: '', email: '', address: '', notes: '' };

export default function Customers() {
  const customers = useCustomerStore((s) => s.customers);
  const addCustomer = useCustomerStore((s) => s.add);
  const updateCustomer = useCustomerStore((s) => s.update);
  const removeCustomer = useCustomerStore((s) => s.remove);
  const sales = useSalesStore((s) => s.sales);
  const symbol = useSettingsStore((s) => s.settings.currencySymbol);
  const { t } = useTranslation();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [profile, setProfile] = useState<Customer | null>(null);

  const filtered = customers.filter(
    (c) => !debouncedSearch || c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || c.phone.includes(debouncedSearch) || c.email.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  }
  function openEdit(c: Customer) {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone, email: c.email, address: c.address, notes: c.notes });
    setErrors({});
    setModalOpen(true);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function save() {
    if (!validate()) return;
    if (editing) updateCustomer(editing.id, form);
    else addCustomer(form);
    setModalOpen(false);
  }

  function purchasesFor(customerId: string) {
    return sales.filter((s) => s.customerId === customerId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const columns: DataTableColumn<Customer>[] = [
    { key: 'name', header: 'Customer', sortable: true, render: (c) => <span className="font-medium text-ink dark:text-slate2-50">{c.name}</span> },
    { key: 'phone', header: 'Phone' },
    { key: 'email', header: 'Email' },
    { key: 'rewardPoints', header: 'Points', sortable: true, render: (c) => <Badge tone="citrus"><Star className="mr-1 h-3 w-3" />{c.rewardPoints}</Badge> },
    {
      key: 'debtBalance',
      header: 'Debt',
      sortable: true,
      render: (c) => (c.debtBalance > 0 ? <Badge tone="tomato">{formatCurrency(c.debtBalance, symbol)}</Badge> : <span className="text-slate2-400">—</span>)
    },
    {
      key: 'id',
      header: 'Actions',
      render: (c) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(c)}>
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
          <h1 className="font-display text-xl font-semibold text-ink dark:text-slate2-50">{t('customers_title')}</h1>
          <p className="text-sm text-slate2-400">{customers.length} {t('customers_subtitle')}</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> {t('customers_create')}
        </Button>
      </div>

      <Input placeholder={t('products_searchPlaceholder')} leftIcon={<Search className="h-4 w-4" />} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full max-w-xs" />

      {customers.length === 0 ? (
        <EmptyState title={t('customers_emptyTitle')} description={t('customers_emptyDesc')} actionLabel={t('customers_create')} onAction={openNew} />
      ) : (
        <DataTable columns={columns} data={filtered} pageSize={10} onRowClick={setProfile} />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('customers_edit') : t('customers_create')}
        size="sm"
        footer={
          <>
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setModalOpen(false)}>
              {t('common_cancel')}
            </Button>
            <Button className="flex-1 sm:flex-none" onClick={save}>{editing ? t('common_saveChanges') : t('customers_create')}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Input label={t('customers_fullName')} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={errors.name} />
          <Input label={t('customers_phone')} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <Input label={t('customers_email')} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} error={errors.email} />
          <Input label={t('customers_address')} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          <Textarea label={t('customers_notes')} rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </div>
      </Modal>

      <Drawer open={!!profile} onClose={() => setProfile(null)} title={profile?.name}>
        {profile && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate2-50 p-3 dark:bg-slate2-900">
                <p className="text-xs text-slate2-400">{t('customers_rewardPoints')}</p>
                <p className="font-display text-lg font-semibold text-ink dark:text-slate2-50">{profile.rewardPoints}</p>
              </div>
              <div className="rounded-lg bg-slate2-50 p-3 dark:bg-slate2-900">
                <p className="text-xs text-slate2-400">{t('customers_debtBalance')}</p>
                <p className="font-display text-lg font-semibold text-ink dark:text-slate2-50">{formatCurrency(profile.debtBalance, symbol)}</p>
              </div>
              <div className="rounded-lg bg-slate2-50 p-3 dark:bg-slate2-900">
                <p className="text-xs text-slate2-400">{t('customers_totalPurchases')}</p>
                <p className="font-display text-lg font-semibold text-ink dark:text-slate2-50">{purchasesFor(profile.id).length}</p>
              </div>
              <div className="rounded-lg bg-slate2-50 p-3 dark:bg-slate2-900">
                <p className="text-xs text-slate2-400">{t('customers_lifetimeSpend')}</p>
                <p className="font-display text-lg font-semibold text-ink dark:text-slate2-50">
                  {formatCurrency(purchasesFor(profile.id).reduce((s, x) => s + x.total, 0), symbol)}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-slate2-400">{t('customers_contact')}</p>
              <p className="text-sm text-slate2-600 dark:text-slate2-300">{profile.phone || '—'}</p>
              <p className="text-sm text-slate2-600 dark:text-slate2-300">{profile.email || '—'}</p>
              <p className="text-sm text-slate2-600 dark:text-slate2-300">{profile.address || '—'}</p>
            </div>

            {profile.notes && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-slate2-400">{t('customers_notes')}</p>
                <p className="text-sm text-slate2-600 dark:text-slate2-300">{profile.notes}</p>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-slate2-400">{t('customers_recentPurchases')}</p>
              <div className="flex flex-col gap-2">
                {purchasesFor(profile.id).length === 0 && <p className="text-sm text-slate2-400">No purchases yet.</p>}
                {purchasesFor(profile.id)
                  .slice(0, 10)
                  .map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border border-slate2-100 px-3 py-2 dark:border-slate2-700">
                      <div>
                        <p className="text-sm font-medium text-ink dark:text-slate2-50">{s.invoiceNumber}</p>
                        <p className="text-xs text-slate2-400">{formatDateTime(s.createdAt)}</p>
                      </div>
                      <span className="text-sm font-semibold text-market-600">{formatCurrency(s.total, symbol)}</span>
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
        onConfirm={() => deleteTarget && removeCustomer(deleteTarget.id)}
        title="Delete this customer?"
        description={`"${deleteTarget?.name}" and their profile will be removed.`}
      />
    </div>
  );
}
