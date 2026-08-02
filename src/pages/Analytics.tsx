import { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Clock, ShoppingBag } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { useSalesStore } from '../stores/useSalesStore';
import { useCustomerStore } from '../stores/useCustomerStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTranslation } from '../hooks/useTranslation';
import { formatCurrency, round2 } from '../utils/currency';
import { hourOf, daysAgo, isSameMonth } from '../utils/date';

export default function Analytics() {
  const sales = useSalesStore((s) => s.sales);
  const customers = useCustomerStore((s) => s.customers);
  const symbol = useSettingsStore((s) => s.settings.currencySymbol);
  const { t } = useTranslation();

  const completedSales = sales.filter((s) => s.status !== 'refunded');

  const productPerf = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    completedSales.forEach((s) =>
      s.items.forEach((it) => {
        const existing = map.get(it.productId) ?? { name: it.name, qty: 0, revenue: 0 };
        existing.qty += it.quantity;
        existing.revenue += it.unitPrice * it.quantity;
        map.set(it.productId, existing);
      })
    );
    const arr = Array.from(map.values()).map((v) => ({ ...v, revenue: round2(v.revenue) }));
    return {
      best: [...arr].sort((a, b) => b.qty - a.qty).slice(0, 8),
      worst: [...arr].sort((a, b) => a.qty - b.qty).slice(0, 8)
    };
  }, [completedSales]);

  const revenueTrend = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => {
      const day = daysAgo(29 - i);
      const label = day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const total = round2(
        completedSales
          .filter((s) => {
            const d = new Date(s.createdAt);
            return d.toDateString() === day.toDateString();
          })
          .reduce((sum, s) => sum + s.total, 0)
      );
      return { label, total };
    });
  }, [completedSales]);

  const peakHours = useMemo(() => {
    const buckets = Array.from({ length: 24 }).map((_, h) => ({ hour: `${h}:00`, sales: 0 }));
    completedSales.forEach((s) => {
      const h = hourOf(s.createdAt);
      buckets[h].sales += 1;
    });
    return buckets;
  }, [completedSales]);

  const thisMonth = completedSales.filter((s) => isSameMonth(s.createdAt));
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonth = completedSales.filter((s) => isSameMonth(s.createdAt, lastMonthDate));
  const thisMonthRevenue = round2(thisMonth.reduce((s, x) => s + x.total, 0));
  const lastMonthRevenue = round2(lastMonth.reduce((s, x) => s + x.total, 0));
  const growth = lastMonthRevenue > 0 ? round2(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0;

  const avgOrder = completedSales.length > 0 ? round2(completedSales.reduce((s, x) => s + x.total, 0) / completedSales.length) : 0;

  const topCustomers = useMemo(() => {
    const map = new Map<string, number>();
    completedSales.forEach((s) => {
      if (!s.customerId) return;
      map.set(s.customerId, (map.get(s.customerId) ?? 0) + s.total);
    });
    return Array.from(map.entries())
      .map(([id, total]) => ({ name: customers.find((c) => c.id === id)?.name ?? 'Unknown', total: round2(total) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [completedSales, customers]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink dark:text-slate2-50">{t('analytics_title')}</h1>
        <p className="text-sm text-slate2-400">{t('analytics_subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label={t('analytics_monthlyGrowth')} value={`${growth}%`} icon={growth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />} tone={growth >= 0 ? 'market' : 'tomato'} />
        <StatCard label={t('analytics_averageOrder')} value={formatCurrency(avgOrder, symbol)} icon={<ShoppingBag className="h-4 w-4" />} tone="citrus" />
        <StatCard label={t('analytics_ordersThisMonth')} value={String(thisMonth.length)} icon={<Clock className="h-4 w-4" />} tone="slate" />
        <StatCard label={t('analytics_totalOrders')} value={String(completedSales.length)} icon={<ShoppingBag className="h-4 w-4" />} tone="market" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('analytics_revenueTrend')}</CardTitle>
        </CardHeader>
        <CardContent className="h-72 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E6EA" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="#9AA1AC" interval={4} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#9AA1AC" width={50} />
              <Tooltip formatter={(v: number) => formatCurrency(v, symbol)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="total" stroke="#1F6D4C" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics_bestSelling')}</CardTitle>
          </CardHeader>
          <CardContent className="h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productPerf.best} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} stroke="#9AA1AC" />
                <YAxis type="category" dataKey="name" width={110} tickLine={false} axisLine={false} fontSize={11} stroke="#9AA1AC" />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="qty" fill="#1F6D4C" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('analytics_worstSelling')}</CardTitle>
          </CardHeader>
          <CardContent className="h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productPerf.worst} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} stroke="#9AA1AC" />
                <YAxis type="category" dataKey="name" width={110} tickLine={false} axisLine={false} fontSize={11} stroke="#9AA1AC" />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="qty" fill="#C4453C" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('analytics_peakHours')}</CardTitle>
        </CardHeader>
        <CardContent className="h-64 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={peakHours}>
              <XAxis dataKey="hour" tickLine={false} axisLine={false} fontSize={10} stroke="#9AA1AC" interval={2} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#9AA1AC" width={30} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="sales" fill="#E8A33D" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('analytics_topCustomers')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topCustomers.length === 0 && <p className="text-sm text-slate2-400">{t('analytics_noCustomerData')}</p>}
          {topCustomers.map((c, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink dark:text-slate2-50">
                {i + 1}. {c.name}
              </span>
              <span className="text-sm font-semibold text-market-600">{formatCurrency(c.total, symbol)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
