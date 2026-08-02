import { useState } from 'react';
import { Plus, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { DataTable, type DataTableColumn } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { usePurchaseOrderStore } from '../stores/usePurchaseOrderStore';
import { useSupplierStore } from '../stores/useSupplierStore';
import { useProductStore } from '../stores/useProductStore';
import { useLocationStore } from '../stores/useLocationStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTranslation } from '../hooks/useTranslation';
import { usePermissions } from '../hooks/usePermissions';
import { formatCurrency, round2 } from '../utils/currency';
import { formatDate } from '../utils/date';
import type { PurchaseOrder, PurchaseOrderItem } from '../types';

export default function PurchaseOrders() {
  const orders = usePurchaseOrderStore((s) => s.orders);
  const createOrder = usePurchaseOrderStore((s) => s.create);
  const markDelivered = usePurchaseOrderStore((s) => s.markDelivered);
  const cancelOrder = usePurchaseOrderStore((s) => s.cancel);
  const suppliers = useSupplierStore((s) => s.suppliers);
  const products = useProductStore((s) => s.products);
  const receiveStock = useProductStore((s) => s.receiveStock);
  const locations = useLocationStore((s) => s.locations);
  const symbol = useSettingsStore((s) => s.settings.currencySymbol);
  const { t } = useTranslation();
  const { can, currentUser } = usePermissions();

  const [modalOpen, setModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('1');
  const [detail, setDetail] = useState<PurchaseOrder | null>(null);
  const [receiveLocationId, setReceiveLocationId] = useState('');

  function addItem() {
    const product = products.find((p) => p.id === productId);
    if (!product || !qty || Number(qty) <= 0) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) return prev.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + Number(qty) } : i));
      return [...prev, { productId, quantity: Number(qty), unitCost: product.costPrice }];
    });
    setQty('1');
  }

  function submit() {
    if (!supplierId || items.length === 0) return;
    createOrder(supplierId, items, currentUser?.id ?? null, can('purchaseOrders.approve'));
    setModalOpen(false);
    setSupplierId('');
    setItems([]);
  }

  function openDetail(order: PurchaseOrder) {
    setDetail(order);
    setReceiveLocationId(locations[0]?.id ?? '');
  }

  function receive(order: PurchaseOrder) {
    if (!receiveLocationId) return;
    order.items.forEach((it) => receiveStock(it.productId, receiveLocationId, it.quantity, 'Received from PO', order.poNumber));
    markDelivered(order.id);
    setDetail(null);
  }

  const columns: DataTableColumn<PurchaseOrder>[] = [
    { key: 'poNumber', header: 'PO Number', sortable: true, render: (o) => <span className="font-medium text-ink dark:text-slate2-50">{o.poNumber}</span> },
    { key: 'supplierId', header: 'Supplier', render: (o) => suppliers.find((s) => s.id === o.supplierId)?.name ?? '—' },
    { key: 'items', header: 'Items', render: (o) => `${o.items.length} products` },
    {
      key: 'items2',
      header: 'Total Value',
      render: (o) => formatCurrency(round2(o.items.reduce((s, i) => s + i.quantity * i.unitCost, 0)), symbol)
    },
    { key: 'createdAt', header: 'Created', sortable: true, render: (o) => formatDate(o.createdAt) },
    {
      key: 'approvalStatus',
      header: 'Approval',
      render: (o) => <Badge tone={o.approvalStatus === 'approved' ? 'market' : o.approvalStatus === 'rejected' ? 'tomato' : 'citrus'}>{o.approvalStatus}</Badge>
    },
    {
      key: 'status',
      header: 'Status',
      render: (o) => <Badge tone={o.status === 'delivered' ? 'market' : o.status === 'cancelled' ? 'tomato' : 'citrus'}>{o.status}</Badge>
    }
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink dark:text-slate2-50">{t('po_title')}</h1>
          <p className="text-sm text-slate2-400">{orders.length} {t('po_subtitle')}</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> {t('po_create')}
        </Button>
      </div>

      {orders.length === 0 ? (
        <EmptyState title={t('po_emptyTitle')} description={t('po_emptyDesc')} actionLabel={t('po_create')} onAction={() => setModalOpen(true)} />
      ) : (
        <DataTable columns={columns} data={orders} pageSize={10} onRowClick={openDetail} />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t('po_create')}
        size="md"
        footer={
          <>
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setModalOpen(false)}>
              {t('common_cancel')}
            </Button>
            <Button className="flex-1 sm:flex-none" onClick={submit} disabled={!supplierId || items.length === 0}>
              {t('po_create')}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {!can('purchaseOrders.approve') && (
            <p className="rounded-lg bg-citrus-50 px-3 py-2 text-xs text-citrus-600 dark:bg-citrus-500/10">This order will need finance approval before it can be received.</p>
          )}
          <Select label={t('po_supplier')} value={supplierId} onChange={(e) => setSupplierId(e.target.value)} options={suppliers.map((s) => ({ value: s.id, label: s.name }))} placeholder={t('po_selectSupplier')} />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Select label={t('po_product')} value={productId} onChange={(e) => setProductId(e.target.value)} options={products.map((p) => ({ value: p.id, label: p.name }))} placeholder={t('po_selectProduct')} className="flex-1" />
            <Input label={t('po_quantity')} type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="w-full sm:w-24" />
            <Button variant="outline" onClick={addItem}>
              {t('common_add')}
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {items.map((it) => {
              const product = products.find((p) => p.id === it.productId);
              return (
                <div key={it.productId} className="flex items-center justify-between rounded-lg border border-slate2-100 px-3 py-2 text-sm dark:border-slate2-700">
                  <span>{product?.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate2-400">
                      {it.quantity} × {formatCurrency(it.unitCost, symbol)}
                    </span>
                    <button onClick={() => setItems((prev) => prev.filter((x) => x.productId !== it.productId))}>
                      <Trash2 className="h-3.5 w-3.5 text-tomato-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.poNumber} size="md">
        {detail && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate2-400">Supplier</p>
                <p className="font-medium text-ink dark:text-slate2-50">{suppliers.find((s) => s.id === detail.supplierId)?.name}</p>
              </div>
              <div className="flex gap-2">
                <Badge tone={detail.approvalStatus === 'approved' ? 'market' : detail.approvalStatus === 'rejected' ? 'tomato' : 'citrus'}>{detail.approvalStatus}</Badge>
                <Badge tone={detail.status === 'delivered' ? 'market' : detail.status === 'cancelled' ? 'tomato' : 'citrus'}>{detail.status}</Badge>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {detail.items.map((it) => {
                const product = products.find((p) => p.id === it.productId);
                return (
                  <div key={it.productId} className="flex items-center justify-between rounded-lg border border-slate2-100 px-3 py-2 text-sm dark:border-slate2-700">
                    <span>{product?.name}</span>
                    <span>
                      {it.quantity} × {formatCurrency(it.unitCost, symbol)} = {formatCurrency(round2(it.quantity * it.unitCost), symbol)}
                    </span>
                  </div>
                );
              })}
            </div>
            {detail.status === 'pending' && detail.approvalStatus === 'approved' && (
              <>
                <Select label="Receive Into Location" value={receiveLocationId} onChange={(e) => setReceiveLocationId(e.target.value)} options={locations.map((l) => ({ value: l.id, label: l.name }))} />
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => receive(detail)}>
                    <CheckCircle2 className="h-4 w-4" /> {t('po_receiveDeliver')}
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={() => {
                      cancelOrder(detail.id);
                      setDetail(null);
                    }}
                  >
                    <XCircle className="h-4 w-4" /> {t('po_cancelOrder')}
                  </Button>
                </div>
              </>
            )}
            {detail.status === 'pending' && detail.approvalStatus === 'pending' && (
              <p className="rounded-lg bg-citrus-50 px-3 py-2 text-sm text-citrus-600 dark:bg-citrus-500/10">Awaiting finance approval — visit the Finance page to approve or reject.</p>
            )}
            {detail.status === 'pending' && detail.approvalStatus === 'rejected' && (
              <p className="rounded-lg bg-tomato-50 px-3 py-2 text-sm text-tomato-600 dark:bg-tomato-500/10">This order was rejected by finance and cannot be received.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
