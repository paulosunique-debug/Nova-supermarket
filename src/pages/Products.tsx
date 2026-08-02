import { useMemo, useState } from 'react';
import { Plus, Search, Copy, Pencil, Trash2, Package, Filter, PackagePlus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { DataTable, type DataTableColumn } from '../components/ui/DataTable';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Dropdown, DropdownItem } from '../components/ui/Dropdown';
import { EmptyState } from '../components/ui/EmptyState';
import { StockActionModal } from '../components/ui/StockActionModal';
import { ProductFormModal } from './ProductFormModal';
import { useProductStore } from '../stores/useProductStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useSupplierStore } from '../stores/useSupplierStore';
import { useLocationStore } from '../stores/useLocationStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTranslation } from '../hooks/useTranslation';
import { useDebounce } from '../hooks/useDebounce';
import { formatCurrency } from '../utils/currency';
import { getExpiryStatus, formatExpiryLabel } from '../utils/date';
import { totalStock, stockAt } from '../utils/stock';
import { exportCSV } from '../utils/csv';
import type { Product } from '../types';

type ProductRow = Product & { totalStockValue: number };

export default function Products() {
  const products = useProductStore((s) => s.products);
  const removeProduct = useProductStore((s) => s.remove);
  const duplicateProduct = useProductStore((s) => s.duplicate);
  const categories = useCategoryStore((s) => s.categories);
  const suppliers = useSupplierStore((s) => s.suppliers);
  const locations = useLocationStore((s) => s.locations);
  const symbol = useSettingsStore((s) => s.settings.currencySymbol);
  const { t } = useTranslation();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [expiryFilter, setExpiryFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [stockTarget, setStockTarget] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    return products
      .filter((p) => {
        const stock = totalStock(p);
        const matchesSearch =
          !debouncedSearch ||
          p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          p.sku.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          p.barcode.includes(debouncedSearch);
        const matchesCategory = !categoryFilter || p.categoryId === categoryFilter;
        const matchesStock =
          !stockFilter ||
          (stockFilter === 'low' && stock <= p.reorderLevel && stock > 0) ||
          (stockFilter === 'out' && stock === 0) ||
          (stockFilter === 'in' && stock > p.reorderLevel);
        const status = getExpiryStatus(p.expiryDate);
        const matchesExpiry = !expiryFilter || status === expiryFilter;
        return matchesSearch && matchesCategory && matchesStock && matchesExpiry;
      })
      .map((p) => ({ ...p, totalStockValue: totalStock(p) }));
  }, [products, debouncedSearch, categoryFilter, stockFilter, expiryFilter]);

  const columns: DataTableColumn<ProductRow>[] = [
    {
      key: 'name',
      header: 'Product',
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate2-100 dark:bg-slate2-700">
            {p.imageUrl ? <img src={p.imageUrl} className="h-full w-full object-cover" /> : <Package className="h-4 w-4 text-slate2-400" />}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-ink dark:text-slate2-50">{p.name}</p>
            <p className="truncate font-mono text-xs text-slate2-400">{p.sku}</p>
          </div>
        </div>
      )
    },
    {
      key: 'categoryId',
      header: 'Category',
      render: (p) => {
        const cat = categories.find((c) => c.id === p.categoryId);
        return cat ? <Badge tone="market">{cat.name}</Badge> : <span className="text-slate2-400">—</span>;
      }
    },
    { key: 'sellingPrice', header: 'Price', sortable: true, render: (p) => formatCurrency(p.sellingPrice, symbol) },
    { key: 'costPrice', header: 'Cost', sortable: true, render: (p) => formatCurrency(p.costPrice, symbol) },
    {
      key: 'totalStockValue',
      header: 'Stock',
      sortable: true,
      render: (p) => {
        const stock = totalStock(p);
        return (
          <div>
            <span className={stock === 0 ? 'font-medium text-tomato-500' : stock <= p.reorderLevel ? 'font-medium text-citrus-500' : ''}>
              {stock} {p.unit}
            </span>
            <p className="text-[11px] text-slate2-400">
              {locations.map((l) => `${l.name} ${stockAt(p, l.id)}`).join(' · ')}
            </p>
          </div>
        );
      }
    },
    {
      key: 'expiryDate',
      header: t('products_expiry'),
      sortable: true,
      render: (p) => {
        const status = getExpiryStatus(p.expiryDate);
        if (status === 'none') return <span className="text-slate2-400">—</span>;
        return <Badge tone={status === 'expired' ? 'tomato' : status === 'expiring' ? 'citrus' : 'market'}>{formatExpiryLabel(p.expiryDate)}</Badge>;
      }
    },
    {
      key: 'id',
      header: t('common_actions'),
      render: (p) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Dropdown
            trigger={
              <Button variant="ghost" size="sm">
                ···
              </Button>
            }
          >
            <DropdownItem
              onClick={() => {
                setEditing(p);
                setModalOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" /> {t('common_edit')}
            </DropdownItem>
            <DropdownItem onClick={() => setStockTarget(p)}>
              <PackagePlus className="h-3.5 w-3.5" /> Update Stock
            </DropdownItem>
            <DropdownItem onClick={() => duplicateProduct(p.id)}>
              <Copy className="h-3.5 w-3.5" /> Duplicate
            </DropdownItem>
            <DropdownItem danger onClick={() => setDeleteTarget(p)}>
              <Trash2 className="h-3.5 w-3.5" /> {t('common_delete')}
            </DropdownItem>
          </Dropdown>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink dark:text-slate2-50">{t('products_title')}</h1>
          <p className="text-sm text-slate2-400">{products.length} {t('products_subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() =>
              exportCSV(
                'products.csv',
                products.map((p) => ({
                  name: p.name,
                  sku: p.sku,
                  barcode: p.barcode,
                  category: categories.find((c) => c.id === p.categoryId)?.name ?? '',
                  supplier: suppliers.find((s) => s.id === p.supplierId)?.name ?? '',
                  costPrice: p.costPrice,
                  sellingPrice: p.sellingPrice,
                  taxRate: p.taxRate,
                  unit: p.unit,
                  totalStock: totalStock(p),
                  reorderLevel: p.reorderLevel,
                  batchNumber: p.batchNumber,
                  expiryDate: p.expiryDate ?? ''
                }))
              )
            }
          >
            {t('common_export')} CSV
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> {t('products_addProduct')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder={t('products_searchPlaceholder')} leftIcon={<Search className="h-4 w-4" />} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full max-w-xs" />
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} options={categories.map((c) => ({ value: c.id, label: c.name }))} placeholder={t('products_allCategories')} className="w-full max-w-[180px]" />
        <Select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          options={[{ value: 'in', label: t('products_inStock') }, { value: 'low', label: t('products_lowStock') }, { value: 'out', label: t('products_outOfStock') }]}
          placeholder={t('products_allStock')}
          className="w-full max-w-[180px]"
        />
        <Select
          value={expiryFilter}
          onChange={(e) => setExpiryFilter(e.target.value)}
          options={[{ value: 'expiring', label: t('products_expiringSoon') }, { value: 'expired', label: t('products_expired') }]}
          placeholder={t('products_allExpiry')}
          className="w-full max-w-[180px]"
        />
        {(categoryFilter || stockFilter || expiryFilter || search) && (
          <button className="flex items-center gap-1 text-xs text-slate2-400 hover:text-ink" onClick={() => { setSearch(''); setCategoryFilter(''); setStockFilter(''); setExpiryFilter(''); }}>
            <Filter className="h-3 w-3" /> {t('common_clearFilters')}
          </button>
        )}
      </div>

      {products.length === 0 ? (
        <EmptyState icon={<Package className="h-8 w-8" />} title={t('products_emptyTitle')} description={t('products_emptyDesc')} actionLabel={t('products_addProduct')} onAction={() => setModalOpen(true)} />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          pageSize={10}
          selectable
          selectedIds={selected}
          onSelectionChange={setSelected}
          onRowClick={(p) => {
            setEditing(p);
            setModalOpen(true);
          }}
          bulkActions={
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                selected.forEach((id) => removeProduct(id));
                setSelected(new Set());
              }}
            >
              {t('products_deleteSelected')}
            </Button>
          }
        />
      )}

      <ProductFormModal open={modalOpen} onClose={() => setModalOpen(false)} product={editing} />
      <StockActionModal open={!!stockTarget} onClose={() => setStockTarget(null)} product={stockTarget} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && removeProduct(deleteTarget.id)}
        title="Delete this product?"
        description={`"${deleteTarget?.name}" will be permanently removed from your catalog.`}
      />
    </div>
  );
}
