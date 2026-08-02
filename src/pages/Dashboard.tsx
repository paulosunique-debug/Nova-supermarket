import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, Users, Boxes, Receipt, AlertTriangle, CalendarDays, Wallet } from 'lucide-react';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useSalesStore } from '../stores/useSalesStore';
import { useProductStore } from '../stores/useProductStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useCustomerStore } from '../stores/useCustomerStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTranslation } from '../hooks/useTranslation';
import { formatCurrency, formatNumber } from '../utils/currency';
import { formatDateTime, formatExpiryLabel } from '../utils/date';
import { totalStock } from '../utils/stock';

export default function Dashboard() {
  const stats = useDashboardStats();
  const sales = useSalesStore((s) => s.sales);
  const products = useProductStore((s) => s.products);
  const categories = useCategoryStore((s) => s.categories);
  const customers = useCustomerStore((s) => s.customers);
  const symbol = useSettingsStore((s) => s.settings.currencySymbol);
  const { t } = useTranslation();

  const recentSales = [...sales].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);

  const categoryPie = Array.from(stats.categoryTotals.entries())
    .map(([catId, total]) => {
      const cat = categories.find((c) => c.id === catId);
      return { name: cat?.name ?? 'Other', value: Math.round(total * 100) / 100, color: cat?.color ?? '#5B6470' };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink dark:text-slate2-50">{t('dashboard_title')}</h1>
          <p className="text-sm text-slate2-400">{t('dashboard_subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
        <StatCard label={t('dashboard_todaySales')} value={formatCurrency(stats.todayRevenue, symbol)} icon={<DollarSign className="h-4 w-4" />} tone="market" />
        <StatCard label={t('dashboard_monthlySales')} value={formatCurrency(stats.monthRevenue, symbol)} icon={<CalendarDays className="h-4 w-4" />} tone="citrus" />
        <StatCard label={t('dashboard_profit')} value={formatCurrency(stats.profit, symbol)} icon={<TrendingUp className="h-4 w-4" />} tone="market" />
        <StatCard
          label={t('dashboard_revenue')}
          value={formatCurrency(stats.totalRevenue, symbol)}
          icon={<Wallet className="h-4 w-4" />}
          tone="citrus"
          tooltip={
            <div className="flex flex-col gap-1.5">
              <p className="mb-1 font-semibold text-ink dark:text-slate2-50">Revenue by payment method</p>
              <div className="flex justify-between">
                <span className="text-slate2-500">Cash</span>
                <span className="font-medium text-ink dark:text-slate2-50">{formatCurrency(stats.paymentBreakdown.cash, symbol)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate2-500">Card</span>
                <span className="font-medium text-ink dark:text-slate2-50">{formatCurrency(stats.paymentBreakdown.card, symbol)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate2-500">Mobile Banking</span>
                <span className="font-medium text-ink dark:text-slate2-50">{formatCurrency(stats.paymentBreakdown.mobile, symbol)}</span>
              </div>
              {stats.paymentBreakdown.mobileByProvider.size > 0 && (
                <div className="mt-1 border-t border-slate2-100 pt-1.5 dark:border-slate2-700">
                  {Array.from(stats.paymentBreakdown.mobileByProvider.entries()).map(([provider, amount]) => (
                    <div key={provider} className="flex justify-between text-[11px] text-slate2-400">
                      <span>{provider}</span>
                      <span>{formatCurrency(amount, symbol)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          }
        />
        <StatCard label={t('dashboard_customers')} value={formatNumber(customers.length)} icon={<Users className="h-4 w-4" />} tone="slate" />
        <StatCard label={t('dashboard_inventoryValue')} value={formatCurrency(stats.inventoryValue, symbol)} icon={<Boxes className="h-4 w-4" />} tone="market" />
        <StatCard label={t('dashboard_orders')} value={formatNumber(stats.totalOrders)} icon={<Receipt className="h-4 w-4" />} tone="citrus" />
        <StatCard label={t('dashboard_lowStock')} value={formatNumber(stats.lowStock.length)} icon={<AlertTriangle className="h-4 w-4" />} tone="tomato" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{t('dashboard_revenueTrend')}</CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-2 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.trend}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1F6D4C" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#1F6D4C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} stroke="#9AA1AC" />
                <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#9AA1AC" width={50} />
                <Tooltip formatter={(v: number) => formatCurrency(v, symbol)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#1F6D4C" strokeWidth={2} fill="url(#revFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard_salesByCategory')}</CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-2 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryPie} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {categoryPie.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v, symbol)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{t('dashboard_recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {recentSales.length === 0 && <p className="p-5 text-sm text-slate2-400">{t('dashboard_noSales')}</p>}
            {recentSales.map((sale, i) => (
              <motion.div
                key={sale.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-slate2-100 px-4 py-3 last:border-0 sm:px-5 dark:border-slate2-700"
              >
                <div>
                  <p className="text-sm font-medium text-ink dark:text-slate2-50">
                    {sale.invoiceNumber} <span className="text-slate2-400">· {sale.items.length} items</span>
                  </p>
                  <p className="text-xs text-slate2-400">{formatDateTime(sale.createdAt)} · {sale.cashier}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-ink dark:text-slate2-50">{formatCurrency(sale.total, symbol)}</p>
                  <Badge tone={sale.status === 'completed' ? 'market' : 'tomato'}>{sale.status}</Badge>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard_lowStockAlerts')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.lowStock.length === 0 && <p className="text-sm text-slate2-400">{t('dashboard_allStocked')}</p>}
            {stats.lowStock.slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink dark:text-slate2-50">{p.name}</p>
                  <p className="text-xs text-slate2-400">SKU {p.sku}</p>
                </div>
                <Badge tone="tomato">{totalStock(p)} left</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {(stats.expiringSoon.length > 0 || stats.expired.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard_expiryAlerts')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-tomato-500">{t('dashboard_expired')}</p>
              {stats.expired.length === 0 && <p className="text-sm text-slate2-400">{t('dashboard_noExpiry')}</p>}
              <div className="space-y-2">
                {stats.expired.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm text-ink dark:text-slate2-50">{p.name}</p>
                    <Badge tone="tomato">{formatExpiryLabel(p.expiryDate)}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-citrus-500">{t('dashboard_expiringSoon')}</p>
              {stats.expiringSoon.length === 0 && <p className="text-sm text-slate2-400">{t('dashboard_noExpiry')}</p>}
              <div className="space-y-2">
                {stats.expiringSoon.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm text-ink dark:text-slate2-50">{p.name}</p>
                    <Badge tone="citrus">{formatExpiryLabel(p.expiryDate)}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
