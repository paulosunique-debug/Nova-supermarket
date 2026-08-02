import { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Tag,
  Receipt as ReceiptIcon,
  CreditCard,
  Wallet,
  Smartphone,
  Split,
  ScanLine,
  ShoppingCart
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Drawer } from '../components/ui/Drawer';
import { BarcodeScannerModal } from '../components/ui/BarcodeScannerModal';
import { useProductStore } from '../stores/useProductStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useCustomerStore } from '../stores/useCustomerStore';
import { useCartStore } from '../stores/useCartStore';
import { useSalesStore, validateCoupon } from '../stores/useSalesStore';
import { useLocationStore } from '../stores/useLocationStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useNotificationStore } from '../stores/useNotificationStore';
import { useTranslation } from '../hooks/useTranslation';
import { usePermissions } from '../hooks/usePermissions';
import { formatCurrency, round2 } from '../utils/currency';
import { formatDateTime } from '../utils/date';
import { stockAt } from '../utils/stock';
import { cn } from '../utils/cn';
import type { MobileProvider, PaymentMethod, Sale } from '../types';

const MOBILE_PROVIDERS: MobileProvider[] = ['TELEBIRR', 'CBE', 'BOA'];

function CartPanel({ onCharge }: { onCharge: () => void }) {
  const cart = useCartStore();
  const customers = useCustomerStore((s) => s.customers);
  const settings = useSettingsStore((s) => s.settings);
  const notify = useNotificationStore((s) => s.push);
  const { t } = useTranslation();
  const [couponInput, setCouponInput] = useState(cart.couponCode ?? '');
  const [couponError, setCouponError] = useState('');

  const subtotal = round2(cart.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity - l.lineDiscount, 0));
  const discountAmount = round2(cart.discountType === 'percent' ? (subtotal * cart.discount) / 100 : cart.discount);
  const taxTotal = round2(cart.lines.reduce((sum, l) => sum + ((l.unitPrice * l.quantity - l.lineDiscount) * l.taxRate) / 100, 0));
  const total = round2(Math.max(0, subtotal - discountAmount + taxTotal));

  function applyCoupon() {
    if (!couponInput.trim()) {
      cart.setCoupon(null);
      setCouponError('');
      return;
    }
    const result = validateCoupon(couponInput);
    if (!result.valid) {
      setCouponError('Invalid or expired coupon code');
      return;
    }
    cart.setCoupon(couponInput.toUpperCase());
    cart.setDiscount(result.value!, result.type!);
    setCouponError('');
    notify('success', 'Coupon applied', `${couponInput.toUpperCase()} applied to this sale.`);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-slate2-100 p-4 dark:border-slate2-700">
        <Select
          value={cart.customerId ?? ''}
          onChange={(e) => cart.setCustomer(e.target.value || null)}
          options={customers.map((c) => ({ value: c.id, label: c.name }))}
          placeholder={t('pos_walkIn')}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {cart.lines.length === 0 && <p className="py-10 text-center text-sm text-slate2-400">{t('pos_emptyCart')}</p>}
        <div className="flex flex-col gap-3">
          {cart.lines.map((l) => (
            <div key={l.productId} className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink dark:text-slate2-50">{l.name}</p>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate2-400">{formatCurrency(l.unitPrice, settings.currencySymbol)}</span>
                  <input
                    type="number"
                    step="0.01"
                    value={l.unitPrice}
                    onChange={(e) => cart.setLinePrice(l.productId, Number(e.target.value))}
                    className="w-16 rounded border border-slate2-200 bg-transparent px-1 py-0.5 text-xs dark:border-slate2-600"
                  />
                </div>
              </div>
              <button onClick={() => cart.decrementLine(l.productId)} className="rounded-md border border-slate2-200 p-1 dark:border-slate2-600">
                <Minus className="h-3 w-3" />
              </button>
              <input
                type="number"
                min={1}
                value={l.quantity}
                onChange={(e) => cart.setQuantity(l.productId, Number(e.target.value))}
                className="w-12 rounded border border-slate2-200 bg-transparent px-1 py-0.5 text-center text-sm dark:border-slate2-600"
              />
              <button onClick={() => cart.incrementLine(l.productId)} className="rounded-md border border-slate2-200 p-1 dark:border-slate2-600">
                <Plus className="h-3 w-3" />
              </button>
              <button onClick={() => cart.removeLine(l.productId)} className="rounded-md p-1 text-tomato-500 hover:bg-tomato-50">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-slate2-100 p-4 dark:border-slate2-700">
        <div className="mb-3 flex gap-2">
          <Input placeholder={t('pos_coupon')} value={couponInput} onChange={(e) => setCouponInput(e.target.value)} error={couponError} className="flex-1" />
          <Button variant="outline" onClick={applyCoupon}>
            {t('pos_apply')}
          </Button>
        </div>
        <div className="mb-3 flex items-center gap-2">
          <Input
            type="number"
            placeholder={t('pos_discount')}
            value={cart.discount || ''}
            onChange={(e) => cart.setDiscount(Number(e.target.value), cart.discountType)}
            className="flex-1"
          />
          <Select
            value={cart.discountType}
            onChange={(e) => cart.setDiscount(cart.discount, e.target.value as 'amount' | 'percent')}
            options={[{ value: 'amount', label: settings.currencySymbol }, { value: 'percent', label: '%' }]}
            className="w-24"
          />
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-slate2-500">
            <span>{t('pos_subtotal')}</span>
            <span>{formatCurrency(subtotal, settings.currencySymbol)}</span>
          </div>
          <div className="flex justify-between text-slate2-500">
            <span>{t('pos_discount')}</span>
            <span>-{formatCurrency(discountAmount, settings.currencySymbol)}</span>
          </div>
          <div className="flex justify-between text-slate2-500">
            <span>{t('pos_tax')}</span>
            <span>{formatCurrency(taxTotal, settings.currencySymbol)}</span>
          </div>
          <div className="flex justify-between border-t border-slate2-100 pt-2 text-base font-semibold text-ink dark:border-slate2-700 dark:text-slate2-50">
            <span>{t('pos_total')}</span>
            <span>{formatCurrency(total, settings.currencySymbol)}</span>
          </div>
        </div>

        <Button className="mt-4 w-full" size="lg" disabled={cart.lines.length === 0} onClick={onCharge}>
          {t('pos_charge')} {formatCurrency(total, settings.currencySymbol)}
        </Button>
      </div>
    </div>
  );
}

export default function POS() {
  const products = useProductStore((s) => s.products);
  const decreaseForSale = useProductStore((s) => s.decreaseForSale);
  const categories = useCategoryStore((s) => s.categories);
  const addRewardPoints = useCustomerStore((s) => s.addRewardPoints);
  const locations = useLocationStore((s) => s.locations);
  // POS is a physical till on the shop floor — it can only sell what's actually
  // on the shop floor, never straight out of Store/warehouse stock. If no
  // shop-type location exists yet, fall back to any location so the app never
  // becomes completely unsellable.
  const sellableLocations = locations.filter((l) => l.type === 'shop').length > 0 ? locations.filter((l) => l.type === 'shop') : locations;
  const cart = useCartStore();
  const addSale = useSalesStore((s) => s.addSale);
  const settings = useSettingsStore((s) => s.settings);
  const notify = useNotificationStore((s) => s.push);
  const { t } = useTranslation();
  const { currentUser } = usePermissions();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [splitCash, setSplitCash] = useState('0');
  const [splitCard, setSplitCard] = useState('0');
  const [splitMobile, setSplitMobile] = useState('0');
  const [splitMobileProvider, setSplitMobileProvider] = useState<MobileProvider>('TELEBIRR');

  useEffect(() => {
    const stillValid = cart.locationId && sellableLocations.some((l) => l.id === cart.locationId);
    if (!stillValid && sellableLocations.length > 0) cart.setLocation(sellableLocations[0].id);
  }, [sellableLocations]); // eslint-disable-line react-hooks/exhaustive-deps

  const sellingLocationId = cart.locationId ?? sellableLocations[0]?.id ?? '';

  const filteredProducts = products.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search);
    const matchesCategory = !categoryFilter || p.categoryId === categoryFilter;
    return matchesSearch && matchesCategory && stockAt(p, sellingLocationId) > 0;
  });

  const subtotal = round2(cart.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity - l.lineDiscount, 0));
  const discountAmount = round2(cart.discountType === 'percent' ? (subtotal * cart.discount) / 100 : cart.discount);
  const taxTotal = round2(cart.lines.reduce((sum, l) => sum + ((l.unitPrice * l.quantity - l.lineDiscount) * l.taxRate) / 100, 0));
  const total = round2(Math.max(0, subtotal - discountAmount + taxTotal));
  const tendered = Number(cart.amountTendered) || 0;
  const change = round2(Math.max(0, tendered - total));
  const cartItemCount = cart.lines.reduce((sum, l) => sum + l.quantity, 0);

  const splitTotal = round2(Number(splitCash) + Number(splitCard) + Number(splitMobile));

  function addProductToCart(p: (typeof products)[number]) {
    cart.addProduct({
      productId: p.id,
      name: p.name,
      sku: p.sku,
      unitPrice: p.sellingPrice,
      originalPrice: p.sellingPrice,
      taxRate: p.taxRate,
      lineDiscount: 0,
      stock: stockAt(p, sellingLocationId)
    });
  }

  function handleScanned(code: string) {
    const product = products.find((p) => p.barcode === code);
    if (product) {
      addProductToCart(product);
      notify('success', product.name, t('pos_scannedAdded'));
    } else {
      setSearch(code);
      notify('warning', t('pos_scan'), t('pos_scannedNotFound'));
    }
  }

  function completeSale(method: PaymentMethod) {
    if (cart.lines.length === 0) return;
    if (method === 'split' && splitTotal < total) {
      notify('error', 'Split payment incomplete', 'The split amounts do not cover the total.');
      return;
    }
    if (method !== 'split' && tendered < total) {
      notify('error', 'Insufficient payment', 'Amount tendered is less than the total due.');
      return;
    }
    if (method === 'mobile-money' && !cart.mobileProvider) {
      notify('error', 'Select a provider', 'Choose TELEBIRR, CBE, or BOA before charging.');
      return;
    }
    if (method === 'split' && Number(splitMobile) > 0 && !splitMobileProvider) {
      notify('error', 'Select a provider', 'Choose a mobile banking provider for the mobile portion.');
      return;
    }

    const sale = addSale({
      customerId: cart.customerId,
      cashier: currentUser?.name ?? 'Unknown',
      locationId: sellingLocationId || null,
      items: cart.lines.map((l) => ({
        productId: l.productId,
        name: l.name,
        sku: l.sku,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        originalPrice: l.originalPrice,
        taxRate: l.taxRate,
        lineDiscount: l.lineDiscount
      })),
      subtotal,
      discount: discountAmount,
      discountType: cart.discountType,
      couponCode: cart.couponCode,
      tax: taxTotal,
      total,
      amountPaid: method === 'split' ? splitTotal : tendered,
      change: method === 'split' ? round2(splitTotal - total) : change,
      paymentMethod: method,
      mobileProvider: method === 'mobile-money' ? cart.mobileProvider : method === 'split' && Number(splitMobile) > 0 ? splitMobileProvider : null,
      splitPayments:
        method === 'split'
          ? [
              { method: 'cash', amount: Number(splitCash) },
              { method: 'card', amount: Number(splitCard) },
              { method: 'mobile-money', amount: Number(splitMobile), mobileProvider: Number(splitMobile) > 0 ? splitMobileProvider : undefined }
            ].filter((p) => p.amount > 0)
          : null,
      status: 'completed'
    });

    cart.lines.forEach((l) => decreaseForSale(l.productId, sellingLocationId, l.quantity, sale.invoiceNumber));
    if (cart.customerId) addRewardPoints(cart.customerId, Math.floor(total));

    setReceipt(sale);
    setPaymentModalOpen(false);
    setMobileCartOpen(false);
    cart.clearCart();
    setSplitCash('0');
    setSplitCard('0');
    setSplitMobile('0');
  }

  return (
    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1fr_380px]">
      {/* Product grid */}
      <div className="flex flex-col gap-4 pb-20 xl:pb-0">
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder={t('pos_searchPlaceholder')}
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xs"
          />
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} options={categories.map((c) => ({ value: c.id, label: c.name }))} placeholder={t('pos_allCategories')} className="w-full max-w-[200px]" />
          {sellableLocations.length > 1 ? (
            <Select value={sellingLocationId} onChange={(e) => cart.setLocation(e.target.value)} options={sellableLocations.map((l) => ({ value: l.id, label: l.name }))} className="w-full max-w-[160px]" />
          ) : (
            sellableLocations[0] && (
              <span className="flex items-center gap-1.5 rounded-lg border border-slate2-200 px-3 py-2 text-xs text-slate2-500 dark:border-slate2-600 dark:text-slate2-400">
                Selling from <strong className="text-ink dark:text-slate2-50">{sellableLocations[0].name}</strong>
              </span>
            )
          )}
          <Button variant="outline" onClick={() => setScannerOpen(true)}>
            <ScanLine className="h-4 w-4" /> {t('pos_scan')}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5">
          {filteredProducts.map((p) => {
            const line = cart.lines.find((l) => l.productId === p.id);
            return (
              <button
                key={p.id}
                onClick={() => addProductToCart(p)}
                className={cn(
                  'relative flex flex-col items-start rounded-xl border bg-white p-3 text-left transition hover:-translate-y-0.5 hover:shadow-card dark:bg-slate2-800',
                  line ? 'border-market-400 ring-2 ring-market-200 dark:border-market-500 dark:ring-market-900/40' : 'border-slate2-100 dark:border-slate2-700'
                )}
              >
                {line && (
                  <span className="absolute -top-2 -right-2 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-market-500 px-1.5 text-xs font-semibold text-white shadow-card">
                    {line.quantity}
                  </span>
                )}
                <div className="mb-2 flex h-16 w-full items-center justify-center rounded-lg bg-slate2-50 dark:bg-slate2-900">
                  {p.imageUrl ? <img src={p.imageUrl} className="h-full w-full rounded-lg object-cover" /> : <Tag className="h-5 w-5 text-slate2-300" />}
                </div>
                <p className="line-clamp-2 text-sm font-medium text-ink dark:text-slate2-50">{p.name}</p>
                <p className="mt-1 text-sm font-semibold text-market-600">{formatCurrency(p.sellingPrice, settings.currencySymbol)}</p>
                <p className="text-xs text-slate2-400">{stockAt(p, sellingLocationId)} {p.unit} available</p>
              </button>
            );
          })}
          {filteredProducts.length === 0 && <p className="col-span-full py-10 text-center text-sm text-slate2-400">No products match your search.</p>}
        </div>
      </div>

      {/* Desktop: sticky cart panel */}
      <div className="hidden xl:sticky xl:top-4 xl:block xl:max-h-[calc(100vh-6rem)]">
        <div className="flex max-h-[calc(100vh-6rem)] flex-col overflow-hidden rounded-xl border border-slate2-100 bg-white dark:border-slate2-700 dark:bg-slate2-800">
          <CartPanel onCharge={() => setPaymentModalOpen(true)} />
        </div>
      </div>

      {/* Mobile/tablet: floating cart bar */}
      {cartItemCount > 0 && (
        <button
          onClick={() => setMobileCartOpen(true)}
          className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-between gap-3 rounded-xl bg-market-500 px-4 py-3 text-white shadow-pop xl:hidden"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <ShoppingCart className="h-4 w-4" />
            {cartItemCount} · {t('pos_viewCart')}
          </span>
          <span className="font-display text-sm font-semibold">{formatCurrency(total, settings.currencySymbol)}</span>
        </button>
      )}

      <Drawer open={mobileCartOpen} onClose={() => setMobileCartOpen(false)} title={t('pos_cartTitle')} width="max-w-md">
        <div className="-mx-6 -my-5 h-[calc(100vh-4rem)]">
          <CartPanel
            onCharge={() => {
              setMobileCartOpen(false);
              setPaymentModalOpen(true);
            }}
          />
        </div>
      </Drawer>

      <BarcodeScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={handleScanned} title={t('pos_scan')} />

      {/* Payment modal */}
      <Modal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title={t('pos_completePayment')} size="sm">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { m: 'cash', icon: Wallet, label: t('pos_cash') },
                { m: 'card', icon: CreditCard, label: t('pos_card') },
                { m: 'mobile-money', icon: Smartphone, label: t('pos_mobile') }
              ] as const
            ).map(({ m, icon: Icon, label }) => (
              <button
                key={m}
                onClick={() => cart.setPaymentMethod(m)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg border p-3 text-xs',
                  cart.paymentMethod === m ? 'border-market-500 bg-market-50 text-market-600 dark:bg-market-900/30' : 'border-slate2-200 text-slate2-500 dark:border-slate2-600'
                )}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>

          {cart.paymentMethod === 'mobile-money' && (
            <div className="grid grid-cols-3 gap-2">
              {MOBILE_PROVIDERS.map((provider) => (
                <button
                  key={provider}
                  onClick={() => cart.setMobileProvider(provider)}
                  className={cn(
                    'rounded-lg border p-2 text-xs font-medium',
                    cart.mobileProvider === provider ? 'border-market-500 bg-market-50 text-market-600 dark:bg-market-900/30' : 'border-slate2-200 text-slate2-500 dark:border-slate2-600'
                  )}
                >
                  {provider}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => cart.setPaymentMethod('split')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg border p-2 text-sm',
              cart.paymentMethod === 'split' ? 'border-market-500 bg-market-50 text-market-600 dark:bg-market-900/30' : 'border-slate2-200 text-slate2-500 dark:border-slate2-600'
            )}
          >
            <Split className="h-4 w-4" /> {t('pos_split')}
          </button>

          {cart.paymentMethod === 'split' ? (
            <div className="grid grid-cols-3 gap-2">
              <Input label={t('pos_cash')} type="number" value={splitCash} onChange={(e) => setSplitCash(e.target.value)} />
              <Input label={t('pos_card')} type="number" value={splitCard} onChange={(e) => setSplitCard(e.target.value)} />
              <Input label={t('pos_mobile')} type="number" value={splitMobile} onChange={(e) => setSplitMobile(e.target.value)} />
              {Number(splitMobile) > 0 && (
                <div className="col-span-3 grid grid-cols-3 gap-2">
                  {MOBILE_PROVIDERS.map((provider) => (
                    <button
                      key={provider}
                      onClick={() => setSplitMobileProvider(provider)}
                      className={cn(
                        'rounded-lg border p-1.5 text-xs font-medium',
                        splitMobileProvider === provider ? 'border-market-500 bg-market-50 text-market-600 dark:bg-market-900/30' : 'border-slate2-200 text-slate2-500 dark:border-slate2-600'
                      )}
                    >
                      {provider}
                    </button>
                  ))}
                </div>
              )}
              <p className="col-span-3 text-xs text-slate2-400">
                Total entered: {formatCurrency(splitTotal, settings.currencySymbol)} / {formatCurrency(total, settings.currencySymbol)}
              </p>
            </div>
          ) : (
            <Input
              label={t('pos_amountTendered')}
              type="number"
              value={cart.amountTendered || ''}
              onChange={(e) => cart.setAmountTendered(Number(e.target.value))}
            />
          )}

          {cart.paymentMethod !== 'split' && (
            <div className="rounded-lg bg-slate2-50 p-3 text-sm dark:bg-slate2-900">
              {t('pos_changeDue')} <span className="font-semibold text-ink dark:text-slate2-50">{formatCurrency(change, settings.currencySymbol)}</span>
            </div>
          )}

          <Button size="lg" onClick={() => completeSale(cart.paymentMethod)}>
            {t('pos_completeSale')}
          </Button>
        </div>
      </Modal>

      {/* Receipt preview */}
      <Modal open={!!receipt} onClose={() => setReceipt(null)} title={t('pos_receipt')} size="sm">
        {receipt && (
          <div className="font-mono text-sm">
            <div className="text-center">
              <p className="font-display text-base font-semibold text-ink dark:text-slate2-50">{settings.storeName}</p>
              <p className="text-xs text-slate2-400">{formatDateTime(receipt.createdAt)}</p>
              <p className="text-xs text-slate2-400">{receipt.invoiceNumber}</p>
            </div>
            <div className="my-3 border-t border-dashed border-slate2-300" />
            {receipt.items.map((it) => (
              <div key={it.productId} className="flex justify-between text-xs">
                <span>
                  {it.quantity}x {it.name}
                </span>
                <span>{formatCurrency(it.unitPrice * it.quantity, settings.currencySymbol)}</span>
              </div>
            ))}
            <div className="my-3 border-t border-dashed border-slate2-300" />
            <div className="flex justify-between text-xs">
              <span>Subtotal</span>
              <span>{formatCurrency(receipt.subtotal, settings.currencySymbol)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Discount</span>
              <span>-{formatCurrency(receipt.discount, settings.currencySymbol)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Tax</span>
              <span>{formatCurrency(receipt.tax, settings.currencySymbol)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span>{formatCurrency(receipt.total, settings.currencySymbol)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate2-400">
              <span>Paid ({receipt.paymentMethod}{receipt.mobileProvider ? ` · ${receipt.mobileProvider}` : ''})</span>
              <span>{formatCurrency(receipt.amountPaid, settings.currencySymbol)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate2-400">
              <span>Change</span>
              <span>{formatCurrency(receipt.change, settings.currencySymbol)}</span>
            </div>
            <div className="receipt-edge mt-3 text-slate2-200 dark:text-slate2-700" />
            <p className="mt-3 text-center text-xs text-slate2-400">{settings.receiptFooter}</p>
            <Button className="mt-4 w-full" variant="outline" onClick={() => window.print()}>
              <ReceiptIcon className="h-4 w-4" /> {t('pos_printReceipt')}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
