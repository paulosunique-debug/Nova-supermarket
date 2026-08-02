import { useState } from 'react';
import { Search, Printer, Download, RotateCcw, Filter } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { DataTable, type DataTableColumn } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { useSalesStore } from '../stores/useSalesStore';
import { useCustomerStore } from '../stores/useCustomerStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTranslation } from '../hooks/useTranslation';
import { useDebounce } from '../hooks/useDebounce';
import { formatCurrency } from '../utils/currency';
import { formatDateTime } from '../utils/date';
import { exportJSON } from '../utils/csv';
import type { Sale } from '../types';

export default function SalesHistory() {
  const sales = useSalesStore((s) => s.sales);
  const refund = useSalesStore((s) => s.refund);
  const customers = useCustomerStore((s) => s.customers);
  const symbol = useSettingsStore((s) => s.settings.currencySymbol);
  const { t } = useTranslation();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [paymentFilter, setPaymentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detail, setDetail] = useState<Sale | null>(null);

  const filtered = sales.filter((s) => {
    const customerName = customers.find((c) => c.id === s.customerId)?.name ?? '';
    const matchesSearch = !debouncedSearch || s.invoiceNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) || customerName.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesPayment = !paymentFilter || s.paymentMethod === paymentFilter;
    const matchesStatus = !statusFilter || s.status === statusFilter;
    return matchesSearch && matchesPayment && matchesStatus;
  });

  const columns: DataTableColumn<Sale>[] = [
    { key: 'invoiceNumber', header: 'Invoice', sortable: true, render: (s) => <span className="font-medium text-ink dark:text-slate2-50">{s.invoiceNumber}</span> },
    { key: 'customerId', header: 'Customer', render: (s) => customers.find((c) => c.id === s.customerId)?.name ?? 'Walk-in' },
    { key: 'cashier', header: 'Cashier' },
    { key: 'items', header: 'Items', render: (s) => s.items.length },
    {
      key: 'paymentMethod',
      header: 'Payment',
      render: (s) => <Badge tone="slate">{s.paymentMethod}{s.mobileProvider ? ` · ${s.mobileProvider}` : ''}</Badge>
    },
    { key: 'total', header: 'Total', sortable: true, render: (s) => formatCurrency(s.total, symbol) },
    { key: 'createdAt', header: 'Date', sortable: true, render: (s) => formatDateTime(s.createdAt) },
    { key: 'status', header: 'Status', render: (s) => <Badge tone={s.status === 'completed' ? 'market' : 'tomato'}>{s.status}</Badge> }
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink dark:text-slate2-50">{t('sh_title')}</h1>
          <p className="text-sm text-slate2-400">{sales.length} {t('sh_subtitle')}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder={t('sh_searchPlaceholder')} leftIcon={<Search className="h-4 w-4" />} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full max-w-xs" />
        <Select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          options={[{ value: 'cash', label: t('pos_cash') }, { value: 'card', label: t('pos_card') }, { value: 'mobile-money', label: 'Mobile Money' }, { value: 'split', label: t('pos_split') }]}
          placeholder={t('sh_allPayments')}
          className="w-full max-w-[200px]"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[{ value: 'completed', label: 'Completed' }, { value: 'refunded', label: 'Refunded' }, { value: 'partially-refunded', label: 'Partially refunded' }]}
          placeholder={t('sh_allStatuses')}
          className="w-full max-w-[200px]"
        />
      </div>

      {sales.length === 0 ? (
        <EmptyState title={t('sh_emptyTitle')} description={t('sh_emptyDesc')} />
      ) : (
        <DataTable columns={columns} data={filtered} pageSize={12} onRowClick={setDetail} />
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.invoiceNumber} size="md">
        {detail && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate2-400">Customer</p>
                <p className="font-medium text-ink dark:text-slate2-50">{customers.find((c) => c.id === detail.customerId)?.name ?? 'Walk-in'}</p>
              </div>
              <div>
                <p className="text-slate2-400">Cashier</p>
                <p className="font-medium text-ink dark:text-slate2-50">{detail.cashier}</p>
              </div>
              <div>
                <p className="text-slate2-400">Date</p>
                <p className="font-medium text-ink dark:text-slate2-50">{formatDateTime(detail.createdAt)}</p>
              </div>
              <div>
                <p className="text-slate2-400">Payment</p>
                <p className="font-medium text-ink dark:text-slate2-50">{detail.paymentMethod}{detail.mobileProvider ? ` · ${detail.mobileProvider}` : ''}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {detail.items.map((it) => (
                <div key={it.productId} className="flex items-center justify-between rounded-lg border border-slate2-100 px-3 py-2 text-sm dark:border-slate2-700">
                  <span>
                    {it.quantity}x {it.name}
                  </span>
                  <span>{formatCurrency(it.unitPrice * it.quantity, symbol)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between border-t border-slate2-100 pt-3 text-base font-semibold text-ink dark:border-slate2-700 dark:text-slate2-50">
              <span>Total</span>
              <span>{formatCurrency(detail.total, symbol)}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> {t('common_print')}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => exportJSON(`${detail.invoiceNumber}.json`, detail)}>
                <Download className="h-4 w-4" /> {t('common_download')}
              </Button>
              {detail.status === 'completed' && (
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => {
                    refund(detail.id, true);
                    setDetail(null);
                  }}
                >
                  <RotateCcw className="h-4 w-4" /> {t('sh_refund')}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
