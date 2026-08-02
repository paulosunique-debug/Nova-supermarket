import { useMemo, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Modal } from '../components/ui/Modal';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { DataTable, type DataTableColumn } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { useExpenseStore } from '../stores/useExpenseStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTranslation } from '../hooks/useTranslation';
import { usePermissions } from '../hooks/usePermissions';
import { Badge } from '../components/ui/Badge';
import { useDebounce } from '../hooks/useDebounce';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';
import type { Expense, ExpenseCategory } from '../types';

const CATEGORIES: ExpenseCategory[] = ['Utilities', 'Salary', 'Transport', 'Rent', 'Marketing', 'Other'];
const emptyForm = { title: '', category: 'Utilities' as ExpenseCategory, amount: '', notes: '' };

export default function Expenses() {
  const expenses = useExpenseStore((s) => s.expenses);
  const addExpense = useExpenseStore((s) => s.add);
  const removeExpense = useExpenseStore((s) => s.remove);
  const symbol = useSettingsStore((s) => s.settings.currencySymbol);
  const { t } = useTranslation();
  const { can, currentUser } = usePermissions();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const filtered = expenses.filter((e) => !debouncedSearch || e.title.toLowerCase().includes(debouncedSearch.toLowerCase()));

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    expenses.filter((e) => e.approvalStatus === 'approved').forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + e.amount));
    return Array.from(map.entries()).map(([category, total]) => ({ category, total: Math.round(total * 100) / 100 }));
  }, [expenses]);

  const totalExpenses = expenses.filter((e) => e.approvalStatus === 'approved').reduce((sum, e) => sum + e.amount, 0);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Enter a valid amount';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function save() {
    if (!validate()) return;
    addExpense({ title: form.title, category: form.category, amount: Number(form.amount), notes: form.notes, createdBy: currentUser?.id ?? null }, can('expenses.approve'));
    setModalOpen(false);
    setForm(emptyForm);
  }

  const columns: DataTableColumn<Expense>[] = [
    { key: 'title', header: 'Title', sortable: true, render: (e) => <span className="font-medium text-ink dark:text-slate2-50">{e.title}</span> },
    { key: 'category', header: 'Category' },
    { key: 'amount', header: 'Amount', sortable: true, render: (e) => formatCurrency(e.amount, symbol) },
    {
      key: 'approvalStatus',
      header: 'Approval',
      render: (e) => <Badge tone={e.approvalStatus === 'approved' ? 'market' : e.approvalStatus === 'rejected' ? 'tomato' : 'citrus'}>{e.approvalStatus}</Badge>
    },
    { key: 'createdAt', header: 'Date', sortable: true, render: (e) => formatDate(e.createdAt) },
    {
      key: 'id',
      header: 'Actions',
      render: (e) => (
        <div onClick={(ev) => ev.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(e)}>
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
          <h1 className="font-display text-xl font-semibold text-ink dark:text-slate2-50">{t('exp_title')}</h1>
          <p className="text-sm text-slate2-400">{t('exp_totalRecorded')} {formatCurrency(totalExpenses, symbol)}</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> {t('exp_add')}
        </Button>
      </div>

      {!can('expenses.approve') && (
        <p className="rounded-lg bg-citrus-50 px-3 py-2 text-xs text-citrus-600 dark:bg-citrus-500/10">New expenses you add require finance approval before they count toward reports.</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('exp_byCategory')}</CardTitle>
        </CardHeader>
        <CardContent className="h-64 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCategory}>
              <XAxis dataKey="category" tickLine={false} axisLine={false} fontSize={12} stroke="#9AA1AC" />
              <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#9AA1AC" width={50} />
              <Tooltip formatter={(v: number) => formatCurrency(v, symbol)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="total" fill="#E8A33D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Input placeholder={t('exp_searchPlaceholder')} leftIcon={<Search className="h-4 w-4" />} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full max-w-xs" />

      {expenses.length === 0 ? (
        <EmptyState title={t('exp_emptyTitle')} description={t('exp_emptyDesc')} actionLabel={t('exp_add')} onAction={() => setModalOpen(true)} />
      ) : (
        <DataTable columns={columns} data={filtered} pageSize={10} />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t('exp_add')}
        size="sm"
        footer={
          <>
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setModalOpen(false)}>
              {t('common_cancel')}
            </Button>
            <Button className="flex-1 sm:flex-none" onClick={save}>{t('exp_add')}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Input label={t('exp_title_field')} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} error={errors.title} />
          <Select label={t('exp_category')} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
          <Input label={t('exp_amount')} type="number" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} error={errors.amount} />
          <Textarea label={t('customers_notes')} rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && removeExpense(deleteTarget.id)}
        title="Delete this expense?"
      />
    </div>
  );
}
