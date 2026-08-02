import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Moon, Sun, Package, Users, Menu, LogOut, UserCog, RotateCcw } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { usePermissions } from '../hooks/usePermissions';
import { useNotificationStore } from '../stores/useNotificationStore';
import { useProductStore } from '../stores/useProductStore';
import { useCustomerStore } from '../stores/useCustomerStore';
import { useUserStore } from '../stores/useUserStore';
import { useAuthStore } from '../stores/useAuthStore';
import { Dropdown, DropdownItem } from '../components/ui/Dropdown';
import { ROLE_LABELS } from '../utils/permissions';
import { formatDateTime } from '../utils/date';
import { cn } from '../utils/cn';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { theme, toggle } = useTheme();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const notifications = useNotificationStore((s) => s.notifications);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const products = useProductStore((s) => s.products);
  const customers = useCustomerStore((s) => s.customers);
  const unread = notifications.filter((n) => !n.read).length;
  const navigate = useNavigate();
  const { currentUser, isPreviewing, originalAdmin } = usePermissions();
  const users = useUserStore((s) => s.users);
  const logout = useAuthStore((s) => s.logout);
  const switchTo = useAuthStore((s) => s.switchTo);
  const returnToAdmin = useAuthStore((s) => s.returnToAdmin);

  const matchedProducts = query.length > 1 ? products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 4) : [];
  const matchedCustomers = query.length > 1 ? customers.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 4) : [];

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate2-100 bg-white px-3 sm:gap-4 sm:px-5 dark:border-slate2-700 dark:bg-slate2-800">
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate2-500 hover:bg-slate2-100 md:hidden dark:text-slate2-300 dark:hover:bg-slate2-700"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative w-full max-w-[160px] flex-1 sm:max-w-xs md:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate2-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={t('topbar_searchPlaceholder')}
          className="h-9 w-full rounded-lg border border-slate2-200 bg-slate2-50 pl-9 pr-3 text-sm outline-none focus:border-market-400 dark:border-slate2-600 dark:bg-slate2-900 dark:text-slate2-50"
        />
        {focused && query.length > 1 && (
          <div className="absolute left-0 top-11 z-30 w-full min-w-[16rem] rounded-lg border border-slate2-100 bg-white py-1 shadow-pop dark:border-slate2-700 dark:bg-slate2-800">
            {matchedProducts.length === 0 && matchedCustomers.length === 0 && (
              <p className="px-3 py-2 text-sm text-slate2-400">No matches for "{query}"</p>
            )}
            {matchedProducts.length > 0 && (
              <div className="px-3 py-1 text-xs font-semibold uppercase text-slate2-400">Products</div>
            )}
            {matchedProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate('/products')}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate2-50 dark:hover:bg-slate2-700"
              >
                <Package className="h-3.5 w-3.5 text-slate2-400" /> {p.name}
              </button>
            ))}
            {matchedCustomers.length > 0 && (
              <div className="px-3 py-1 text-xs font-semibold uppercase text-slate2-400">Customers</div>
            )}
            {matchedCustomers.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate('/customers')}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate2-50 dark:hover:bg-slate2-700"
              >
                <Users className="h-3.5 w-3.5 text-slate2-400" /> {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        <button
          onClick={toggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate2-500 hover:bg-slate2-100 dark:text-slate2-300 dark:hover:bg-slate2-700"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <Dropdown
          trigger={
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate2-500 hover:bg-slate2-100 dark:text-slate2-300 dark:hover:bg-slate2-700">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-tomato-500" />
              )}
            </button>
          }
        >
          <div className="flex w-72 max-w-[85vw] flex-col sm:w-80">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-semibold text-ink dark:text-slate2-50">{t('common_notifications')}</span>
              <button onClick={markAllRead} className="text-xs text-market-500 hover:underline">
                {t('common_markAllRead')}
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 && <p className="px-3 py-6 text-center text-sm text-slate2-400">{t('common_noNotifications')}</p>}
              {notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  className={cn('border-t border-slate2-100 px-3 py-2 dark:border-slate2-700', !n.read && 'bg-market-50/50 dark:bg-market-900/10')}
                >
                  <p className="text-sm font-medium text-ink dark:text-slate2-50">{n.title}</p>
                  <p className="text-xs text-slate2-400">{n.message}</p>
                  <p className="mt-0.5 text-[10px] text-slate2-300">{formatDateTime(n.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </Dropdown>

        {isPreviewing && (
          <button
            onClick={returnToAdmin}
            className="hidden items-center gap-1.5 rounded-lg bg-citrus-50 px-2.5 py-1.5 text-xs font-medium text-citrus-600 sm:flex dark:bg-citrus-500/10 dark:text-citrus-300"
          >
            <RotateCcw className="h-3 w-3" /> Return to {originalAdmin?.name ?? 'Admin'}
          </button>
        )}

        <Dropdown
          align="right"
          trigger={
            <button className="flex h-9 items-center gap-2 rounded-lg px-1.5 hover:bg-slate2-100 dark:hover:bg-slate2-700">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-market-500 text-xs font-semibold text-white">
                {currentUser?.name?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-medium leading-tight text-ink dark:text-slate2-50">{currentUser?.name}</p>
                <p className="text-[10px] leading-tight text-slate2-400">{currentUser ? ROLE_LABELS[currentUser.role] : ''}</p>
              </div>
            </button>
          }
        >
          <div className="w-56">
            <div className="border-b border-slate2-100 px-3 py-2 dark:border-slate2-700">
              <p className="text-sm font-medium text-ink dark:text-slate2-50">{currentUser?.name}</p>
              <p className="text-xs text-slate2-400">{currentUser?.email}</p>
            </div>
            {currentUser?.role === 'admin' && !isPreviewing && users.length > 1 && (
              <div className="border-b border-slate2-100 py-1 dark:border-slate2-700">
                <p className="px-3 py-1 text-[10px] font-semibold uppercase text-slate2-400">Preview as</p>
                {users
                  .filter((u) => u.id !== currentUser.id && u.active)
                  .slice(0, 6)
                  .map((u) => (
                    <DropdownItem key={u.id} onClick={() => switchTo(u.id)}>
                      <UserCog className="h-3.5 w-3.5" /> {u.name} ({ROLE_LABELS[u.role]})
                    </DropdownItem>
                  ))}
              </div>
            )}
            <div className="py-1">
              <DropdownItem danger onClick={logout}>
                <LogOut className="h-3.5 w-3.5" /> Log out
              </DropdownItem>
            </div>
          </div>
        </Dropdown>
      </div>
    </header>
  );
}
