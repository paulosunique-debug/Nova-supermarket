import { useState } from 'react';
import { PackagePlus, Search, AlertTriangle, ArrowLeftRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { DataTable, type DataTableColumn } from '../components/ui/DataTable';
import { StockActionModal } from '../components/ui/StockActionModal';
import { useProductStore } from '../stores/useProductStore';
import { useStockLogStore } from '../stores/useStockLogStore';
import { useLocationStore } from '../stores/useLocationStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTranslation } from '../hooks/useTranslation';
import { useDebounce } from '../hooks/useDebounce';
import { formatCurrency } from '../utils/currency';
import { formatDateTime, getExpiryStatus, formatExpiryLabel } from '../utils/date';
import { totalStock, stockAt } from '../utils/stock';
import type { Product, StockLogEntry } from '../types';

type ProductRow = Product & { totalStockValue: number };

export default function Inventory() {
  const products = useProductStore((s) => s.products);
  const logs = useStockLogStore((s) => s.logs);
  const locations = useLocationStore((s) => s.locations);
  const symbol = useSettingsStore((s) => s.settings.currencySymbol);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [locationFilter, setLocationFilter] = useState('');
  const [stockTarget, setStockTarget] = useState<Product | null>(null);

  const filtered: ProductRow[] = products
    .filter((p) => !debouncedSearch || p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || p.sku.toLowerCase().includes(debouncedSearch.toLowerCase()))
    .map((p) => ({ ...p, totalStockValue: totalStock(p) }));

  const lowStock = products.filter((p) => { const s = totalStock(p); return s <= p.reorderLevel && s > 0; });
  const outOfStock = products.filter((p) => totalStock(p) === 0);
  const expiringSoon = products.filter((p) => getExpiryStatus(p.expiryDate) === 'expiring');
  const expired = products.filter((p) => getExpiryStatus(p.expiryDate) === 'expired');
  const inventoryValue = products.reduce((sum, p) => sum + p.costPrice * totalStock(p), 0);

  const columns: DataTableColumn<ProductRow>[] = [
    { key: 'name', header: 'Product', sortable: true, render: (p) => <span className="font-medium text-ink dark:text-slate2-50">{p.name}</span> },
    { key: 'sku', header: 'SKU', render: (p) => <span className="font-mono text-xs text-slate2-400">{p.sku}</span> },
    ...(locationFilter
      ? [
          {
            key: 'locationStock',
            header: locations.find((l) => l.id === locationFilter)?.name ?? 'Stock',
            render: (p: ProductRow) => {
              const s = stockAt(p, locationFilter);
              return <Badge tone={s === 0 ? 'tomato' : s <= p.reorderLevel ? 'citrus' : 'market'}>{s} {p.unit}</Badge>;
            }
          } as DataTableColumn<ProductRow>
        ]
      : []),
    {
      key: 'totalStockValue',
      header: 'Total Stock',
      sortable: true,
      render: (p) => {
        const s = totalStock(p);
        return <Badge tone={s === 0 ? 'tomato' : s <= p.reorderLevel ? 'citrus' : 'market'}>{s} {p.unit}</Badge>;
      }
    },
    { key: 'reorderLevel', header: 'Reorder Level', render: (p) => `${p.reorderLevel} ${p.unit}` },
    {
      key: 'expiryDate',
      header: t('inventory_expiry'),
      sortable: true,
      render: (p) => {
        const status = getExpiryStatus(p.expiryDate);
        if (status === 'none') return <span className="text-slate2-400">—</span>;
        return <Badge tone={status === 'expired' ? 'tomato' : status === 'expiring' ? 'citrus' : 'market'}>{formatExpiryLabel(p.expiryDate)}</Badge>;
      }
    },
    { key: 'costPrice', header: 'Stock Value', render: (p) => formatCurrency(p.costPrice * totalStock(p), symbol) },
    {
      key: 'id',
      header: 'Actions',
      render: (p) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={() => setStockTarget(p)}>
            <PackagePlus className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/transfers')}>
            <ArrowLeftRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )
    }
  ];

  const logColumns: DataTableColumn<StockLogEntry & { id: string }>[] = [
    { key: 'createdAt', header: 'Date', sortable: true, render: (l) => formatDateTime(l.createdAt) },
    {
      key: 'productId',
      header: 'Product',
      render: (l) => products.find((p) => p.id === l.productId)?.name ?? 'Deleted product'
    },
    { key: 'locationId', header: 'Location', render: (l) => locations.find((loc) => loc.id === l.locationId)?.name ?? '—' },
    {
      key: 'type',
      header: 'Type',
      render: (l) => <Badge tone={l.quantity < 0 ? 'tomato' : 'market'}>{l.type.replace('-', ' ')}</Badge>
    },
    { key: 'quantity', header: 'Qty Change', render: (l) => (l.quantity > 0 ? `+${l.quantity}` : l.quantity) },
    { key: 'resultingStock', header: 'Resulting Stock' },
    { key: 'reason', header: 'Reason', render: (l) => l.reason || l.reference || '—' }
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink dark:text-slate2-50">{t('inventory_title')}</h1>
          <p className="text-sm text-slate2-400">{t('inventory_totalValue')} {formatCurrency(inventoryValue, symbol)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs tabs={[{ value: 'overview', label: t('inventory_overview') }, { value: 'log', label: t('inventory_log'), count: logs.length }]} active={tab} onChange={setTab} />
          <Button variant="outline" onClick={() => navigate('/transfers')}>
            <ArrowLeftRight className="h-4 w-4" /> Transfer
          </Button>
        </div>
      </div>

      {(lowStock.length > 0 || outOfStock.length > 0 || expiringSoon.length > 0 || expired.length > 0) && tab === 'overview' && (
        <div className="flex flex-wrap gap-3">
          {outOfStock.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-tomato-200 bg-tomato-50 px-3 py-2 text-sm text-tomato-600 dark:border-tomato-500/30 dark:bg-tomato-500/10">
              <AlertTriangle className="h-4 w-4" /> {outOfStock.length} {t('inventory_outOfStockAlert')}
            </div>
          )}
          {lowStock.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-citrus-200 bg-citrus-50 px-3 py-2 text-sm text-citrus-600 dark:border-citrus-500/30 dark:bg-citrus-500/10">
              <AlertTriangle className="h-4 w-4" /> {lowStock.length} {t('inventory_lowStockAlert')}
            </div>
          )}
          {expired.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-tomato-200 bg-tomato-50 px-3 py-2 text-sm text-tomato-600 dark:border-tomato-500/30 dark:bg-tomato-500/10">
              <AlertTriangle className="h-4 w-4" /> {expired.length} {t('inventory_expiredAlert')}
            </div>
          )}
          {expiringSoon.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-citrus-200 bg-citrus-50 px-3 py-2 text-sm text-citrus-600 dark:border-citrus-500/30 dark:bg-citrus-500/10">
              <AlertTriangle className="h-4 w-4" /> {expiringSoon.length} {t('inventory_expiringSoon')}
            </div>
          )}
        </div>
      )}

      {tab === 'overview' ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Input placeholder={`${t('common_search')}…`} leftIcon={<Search className="h-4 w-4" />} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full max-w-xs" />
            <Select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} options={locations.map((l) => ({ value: l.id, label: l.name }))} placeholder="All locations (total)" className="w-full max-w-[200px]" />
          </div>
          <DataTable columns={columns} data={filtered} pageSize={10} />
        </>
      ) : (
        <DataTable columns={logColumns} data={logs.map((l) => ({ ...l }))} pageSize={12} />
      )}

      <StockActionModal open={!!stockTarget} onClose={() => setStockTarget(null)} product={stockTarget} />
    </div>
  );
}
