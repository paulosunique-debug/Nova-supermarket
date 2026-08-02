import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAppInit } from './hooks/useAppInit';
import { useTheme } from './hooks/useTheme';
import { useExpiryAlerts } from './hooks/useExpiryAlerts';
import { usePermissions } from './hooks/usePermissions';
import { AppLayout } from './layouts/AppLayout';
import { RequirePermission } from './components/RequirePermission';
import { Leaf } from 'lucide-react';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Inventory from './pages/Inventory';
import POS from './pages/POS';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import PurchaseOrders from './pages/PurchaseOrders';
import SalesHistory from './pages/SalesHistory';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Finance from './pages/Finance';
import Locations from './pages/Locations';
import Transfers from './pages/Transfers';

function AuthedApp() {
  useExpiryAlerts();
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<RequirePermission permission="dashboard.view"><Dashboard /></RequirePermission>} />
          <Route path="/pos" element={<RequirePermission permission="pos.use"><POS /></RequirePermission>} />
          <Route path="/products" element={<RequirePermission permission="products.view"><Products /></RequirePermission>} />
          <Route path="/categories" element={<RequirePermission permission="categories.manage"><Categories /></RequirePermission>} />
          <Route path="/inventory" element={<RequirePermission permission="inventory.manage"><Inventory /></RequirePermission>} />
          <Route path="/transfers" element={<RequirePermission permission="transfers.manage"><Transfers /></RequirePermission>} />
          <Route path="/locations" element={<RequirePermission permission="locations.manage"><Locations /></RequirePermission>} />
          <Route path="/customers" element={<RequirePermission permission="customers.manage"><Customers /></RequirePermission>} />
          <Route path="/suppliers" element={<RequirePermission permission="suppliers.manage"><Suppliers /></RequirePermission>} />
          <Route path="/purchase-orders" element={<RequirePermission permission="purchaseOrders.manage"><PurchaseOrders /></RequirePermission>} />
          <Route path="/sales-history" element={<RequirePermission permission="salesHistory.view"><SalesHistory /></RequirePermission>} />
          <Route path="/expenses" element={<RequirePermission permission="expenses.manage"><Expenses /></RequirePermission>} />
          <Route path="/reports" element={<RequirePermission permission="reports.view"><Reports /></RequirePermission>} />
          <Route path="/analytics" element={<RequirePermission permission="analytics.view"><Analytics /></RequirePermission>} />
          <Route path="/finance" element={<RequirePermission permission="finance.view"><Finance /></RequirePermission>} />
          <Route path="/users" element={<RequirePermission permission="users.manage"><Users /></RequirePermission>} />
          <Route path="/settings" element={<RequirePermission permission="settings.manage"><Settings /></RequirePermission>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  const ready = useAppInit();
  useTheme();
  const { currentUser } = usePermissions();

  if (!ready) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-3 bg-paper dark:bg-slate2-900">
        <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-xl bg-market-500 text-white">
          <Leaf className="h-6 w-6" />
        </div>
        <p className="text-sm text-slate2-400">Setting up your store…</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  return <AuthedApp />;
}
