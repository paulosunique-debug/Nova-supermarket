import { useMemo, useState } from 'react';
import { Download, Printer, FileJson } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { DataTable, type DataTableColumn } from '../components/ui/DataTable';
import { useProductStore } from '../stores/useProductStore';
import { useSalesStore } from '../stores/useSalesStore';
import { useExpenseStore } from '../stores/useExpenseStore';
import { useCustomerStore } from '../stores/useCustomerStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTranslation } from '../hooks/useTranslation';
import { formatCurrency, round2 } from '../utils/currency';
import { exportCSV, exportJSON } from '../utils/csv';
import { totalStock } from '../utils/stock';

export default function Reports() {
  const products = useProductStore((s) => s.products);
  const sales = useSalesStore((s) => s.sales);
  const expenses = useExpenseStore((s) => s.expenses);
  const customers = useCustomerStore((s) => s.customers);
  const categories = useCategoryStore((s) => s.categories);
  const symbol = useSettingsStore((s) => s.settings.currencySymbol);
  const { t } = useTranslation();

  const [tab, setTab] = useState('sales');

  const completedSales = sales.filter((s) => s.status !== 'refunded');
  const totalRevenue = round2(completedSales.reduce((s, x) => s + x.total, 0));
  const totalExpenses = round2(expenses.filter((e) => e.approvalStatus === 'approved').reduce((s, x) => s + x.amount, 0));
  const totalCost = completedSales.reduce(
    (sum, s) => sum + s.items.reduce((ls, it) => ls + (products.find((p) => p.id === it.productId)?.costPrice ?? it.unitPrice * 0.6) * it.quantity, 0),
    0
  );
  const grossProfit = round2(totalRevenue - totalCost);
  const netProfit = round2(grossProfit - totalExpenses);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    completedSales.forEach((s) =>
      s.items.forEach((it) => {
        const existing = map.get(it.productId) ?? { name: it.name, qty: 0, revenue: 0 };
        existing.qty += it.quantity;
        existing.revenue += it.unitPrice * it.quantity;
        map.set(it.productId, existing);
      })
    );
    return Array.from(map.entries())
      .map(([id, v]) => ({ id, ...v, revenue: round2(v.revenue) }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15);
  }, [completedSales]);

  const topCustomers = useMemo(() => {
    const map = new Map<string, number>();
    completedSales.forEach((s) => {
      if (!s.customerId) return;
      map.set(s.customerId, (map.get(s.customerId) ?? 0) + s.total);
    });
    return Array.from(map.entries())
      .map(([id, total]) => ({ id, name: customers.find((c) => c.id === id)?.name ?? 'Unknown', total: round2(total) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);
  }, [completedSales, customers]);

  const inventoryReport = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: categories.find((c) => c.id === p.categoryId)?.name ?? '—',
    stock: totalStock(p),
    value: round2(totalStock(p) * p.costPrice)
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink dark:text-slate2-50">{t('reports_title')}</h1>
          <p className="text-sm text-slate2-400">{t('reports_subtitle')}</p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> {t('common_print')}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-slate2-400">{t('reports_revenue')}</p>
          <p className="font-display text-xl font-semibold text-ink dark:text-slate2-50">{formatCurrency(totalRevenue, symbol)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate2-400">{t('reports_grossProfit')}</p>
          <p className="font-display text-xl font-semibold text-market-600">{formatCurrency(grossProfit, symbol)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate2-400">{t('reports_expenses')}</p>
          <p className="font-display text-xl font-semibold text-tomato-500">{formatCurrency(totalExpenses, symbol)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate2-400">{t('reports_netProfit')}</p>
          <p className="font-display text-xl font-semibold text-ink dark:text-slate2-50">{formatCurrency(netProfit, symbol)}</p>
        </Card>
      </div>

      <Tabs
        tabs={[
          { value: 'sales', label: t('reports_sales') },
          { value: 'inventory', label: t('reports_inventory') },
          { value: 'top-products', label: t('reports_topProducts') },
          { value: 'top-customers', label: t('reports_topCustomers') }
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'sales' && (
        <ReportTable
          title={t('reports_sales')}
          data={completedSales.map((s) => ({ id: s.id, invoice: s.invoiceNumber, total: formatCurrency(s.total, symbol), payment: s.paymentMethod, date: s.createdAt.slice(0, 10) }))}
          columns={[
            { key: 'invoice', header: 'Invoice' },
            { key: 'total', header: 'Total' },
            { key: 'payment', header: 'Payment' },
            { key: 'date', header: 'Date' }
          ]}
          onExportCSV={() => exportCSV('sales-report.csv', completedSales)}
          onExportJSON={() => exportJSON('sales-report.json', completedSales)}
        />
      )}
      {tab === 'inventory' && (
        <ReportTable
          title={t('reports_inventory')}
          data={inventoryReport.map((r) => ({ ...r, value: formatCurrency(r.value, symbol) }))}
          columns={[
            { key: 'name', header: 'Product' },
            { key: 'sku', header: 'SKU' },
            { key: 'category', header: 'Category' },
            { key: 'stock', header: 'Stock' },
            { key: 'value', header: 'Value' }
          ]}
          onExportCSV={() => exportCSV('inventory-report.csv', inventoryReport)}
          onExportJSON={() => exportJSON('inventory-report.json', inventoryReport)}
        />
      )}
      {tab === 'top-products' && (
        <ReportTable
          title={t('reports_topProducts')}
          data={topProducts.map((p) => ({ ...p, revenue: formatCurrency(p.revenue, symbol) }))}
          columns={[
            { key: 'name', header: 'Product' },
            { key: 'qty', header: 'Units Sold' },
            { key: 'revenue', header: 'Revenue' }
          ]}
          onExportCSV={() => exportCSV('top-products.csv', topProducts)}
          onExportJSON={() => exportJSON('top-products.json', topProducts)}
        />
      )}
      {tab === 'top-customers' && (
        <ReportTable
          title={t('reports_topCustomers')}
          data={topCustomers.map((c) => ({ ...c, total: formatCurrency(c.total, symbol) }))}
          columns={[
            { key: 'name', header: 'Customer' },
            { key: 'total', header: 'Total Spend' }
          ]}
          onExportCSV={() => exportCSV('top-customers.csv', topCustomers)}
          onExportJSON={() => exportJSON('top-customers.json', topCustomers)}
        />
      )}
    </div>
  );
}

function ReportTable<T extends { id: string }>({
  title,
  data,
  columns,
  onExportCSV,
  onExportJSON
}: {
  title: string;
  data: T[];
  columns: DataTableColumn<T>[];
  onExportCSV: () => void;
  onExportJSON: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex-col items-start gap-3 sm:flex-row sm:items-center">
        <CardTitle>{title}</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onExportCSV}>
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={onExportJSON}>
            <FileJson className="h-3.5 w-3.5" /> JSON
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={data} pageSize={10} />
      </CardContent>
    </Card>
  );
}
