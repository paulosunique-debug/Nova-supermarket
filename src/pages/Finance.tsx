import { useMemo, useState } from 'react';
import { CheckCircle2, XCircle, Wallet, TrendingUp, TrendingDown, Landmark } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { StatCard } from '../components/ui/StatCard';
import { useSalesStore } from '../stores/useSalesStore';
import { useExpenseStore } from '../stores/useExpenseStore';
import { useProductStore } from '../stores/useProductStore';
import { useSupplierStore } from '../stores/useSupplierStore';
import { useCustomerStore } from '../stores/useCustomerStore';
import { usePurchaseOrderStore } from '../stores/usePurchaseOrderStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { usePermissions } from '../hooks/usePermissions';
import { formatCurrency, round2 } from '../utils/currency';
import { formatDate } from '../utils/date';

export default function Finance() {
  const sales = useSalesStore((s) => s.sales);
  const expenses = useExpenseStore((s) => s.expenses);
  const approveExpense = useExpenseStore((s) => s.approve);
  const rejectExpense = useExpenseStore((s) => s.reject);
  const products = useProductStore((s) => s.products);
  const suppliers = useSupplierStore((s) => s.suppliers);
  const customers = useCustomerStore((s) => s.customers);
  const purchaseOrders = usePurchaseOrderStore((s) => s.orders);
  const approvePO = usePurchaseOrderStore((s) => s.approve);
  const rejectPO = usePurchaseOrderStore((s) => s.reject);
  const symbol = useSettingsStore((s) => s.settings.currencySymbol);
  const { currentUser, can } = usePermissions();

  const [tab, setTab] = useState('overview');

  const completedSales = sales.filter((s) => s.status !== 'refunded');
  const totalRevenue = round2(completedSales.reduce((s, x) => s + x.total, 0));
  const totalCost = completedSales.reduce(
    (sum, s) => sum + s.items.reduce((ls, it) => ls + (products.find((p) => p.id === it.productId)?.costPrice ?? it.unitPrice * 0.6) * it.quantity, 0),
    0
  );
  const grossProfit = round2(totalRevenue - totalCost);
  const approvedExpenses = expenses.filter((e) => e.approvalStatus === 'approved');
  const totalExpenses = round2(approvedExpenses.reduce((s, x) => s + x.amount, 0));
  const netProfit = round2(grossProfit - totalExpenses);

  const payables = round2(suppliers.filter((s) => s.balance < 0).reduce((sum, s) => sum + Math.abs(s.balance), 0));
  const receivables = round2(customers.reduce((sum, c) => sum + c.debtBalance, 0));

  const pendingExpenses = expenses.filter((e) => e.approvalStatus === 'pending');
  const pendingPOs = purchaseOrders.filter((p) => p.approvalStatus === 'pending');

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink dark:text-slate2-50">Finance</h1>
        <p className="text-sm text-slate2-400">Profit & loss, accounts, and approvals.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Revenue" value={formatCurrency(totalRevenue, symbol)} icon={<Wallet className="h-4 w-4" />} tone="market" />
        <StatCard label="Gross Profit" value={formatCurrency(grossProfit, symbol)} icon={<TrendingUp className="h-4 w-4" />} tone="citrus" />
        <StatCard label="Expenses" value={formatCurrency(totalExpenses, symbol)} icon={<TrendingDown className="h-4 w-4" />} tone="tomato" />
        <StatCard label="Net Profit" value={formatCurrency(netProfit, symbol)} icon={<Landmark className="h-4 w-4" />} tone="market" />
      </div>

      <Tabs
        tabs={[
          { value: 'overview', label: 'Accounts' },
          { value: 'approvals', label: 'Approvals', count: pendingExpenses.length + pendingPOs.length }
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'overview' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Accounts Payable (owed to suppliers)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="mb-2 font-display text-xl font-semibold text-tomato-500">{formatCurrency(payables, symbol)}</p>
              {suppliers.filter((s) => s.balance < 0).length === 0 && <p className="text-sm text-slate2-400">No outstanding supplier balances.</p>}
              {suppliers
                .filter((s) => s.balance < 0)
                .map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <span className="text-ink dark:text-slate2-50">{s.name}</span>
                    <span className="font-medium text-tomato-500">{formatCurrency(Math.abs(s.balance), symbol)}</span>
                  </div>
                ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accounts Receivable (owed by customers)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="mb-2 font-display text-xl font-semibold text-market-600">{formatCurrency(receivables, symbol)}</p>
              {customers.filter((c) => c.debtBalance > 0).length === 0 && <p className="text-sm text-slate2-400">No outstanding customer balances.</p>}
              {customers
                .filter((c) => c.debtBalance > 0)
                .map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <span className="text-ink dark:text-slate2-50">{c.name}</span>
                    <span className="font-medium text-market-600">{formatCurrency(c.debtBalance, symbol)}</span>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Pending Expenses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingExpenses.length === 0 && <p className="text-sm text-slate2-400">Nothing waiting on approval.</p>}
              {pendingExpenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate2-100 px-3 py-2 dark:border-slate2-700">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink dark:text-slate2-50">{e.title}</p>
                    <p className="text-xs text-slate2-400">{e.category} · {formatDate(e.createdAt)} · {formatCurrency(e.amount, symbol)}</p>
                  </div>
                  {can('expenses.approve') && (
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" variant="primary" onClick={() => approveExpense(e.id, currentUser?.id ?? '')}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => rejectExpense(e.id, currentUser?.id ?? '')}>
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingPOs.length === 0 && <p className="text-sm text-slate2-400">Nothing waiting on approval.</p>}
              {pendingPOs.map((po) => (
                <div key={po.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate2-100 px-3 py-2 dark:border-slate2-700">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink dark:text-slate2-50">{po.poNumber}</p>
                    <p className="text-xs text-slate2-400">
                      {suppliers.find((s) => s.id === po.supplierId)?.name ?? '—'} · {formatDate(po.createdAt)} ·{' '}
                      {formatCurrency(round2(po.items.reduce((s, i) => s + i.quantity * i.unitCost, 0)), symbol)}
                    </p>
                  </div>
                  {can('purchaseOrders.approve') && (
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" variant="primary" onClick={() => approvePO(po.id, currentUser?.id ?? '')}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => rejectPO(po.id, currentUser?.id ?? '')}>
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
