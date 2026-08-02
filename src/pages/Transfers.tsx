import { useState } from 'react';
import { ArrowRight, ArrowLeftRight, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { DataTable, type DataTableColumn } from '../components/ui/DataTable';
import { EmptyState } from '../components/ui/EmptyState';
import { useTransferStore } from '../stores/useTransferStore';
import { useProductStore } from '../stores/useProductStore';
import { useLocationStore } from '../stores/useLocationStore';
import { usePermissions } from '../hooks/usePermissions';
import { stockAt } from '../utils/stock';
import { formatDateTime } from '../utils/date';
import type { StockTransfer } from '../types';

export default function Transfers() {
  const transfers = useTransferStore((s) => s.transfers);
  const createTransfer = useTransferStore((s) => s.create);
  const products = useProductStore((s) => s.products);
  const locations = useLocationStore((s) => s.locations);
  const { currentUser } = usePermissions();

  const [modalOpen, setModalOpen] = useState(false);
  const [productId, setProductId] = useState('');
  const [fromLocationId, setFromLocationId] = useState('');
  const [toLocationId, setToLocationId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const availableAtFrom = productId && fromLocationId ? stockAt(products.find((p) => p.id === productId)!, fromLocationId) : 0;

  function openNew() {
    setProductId('');
    setFromLocationId(locations[0]?.id ?? '');
    setToLocationId(locations[1]?.id ?? '');
    setQuantity('1');
    setReason('');
    setError('');
    setModalOpen(true);
  }

  function submit() {
    if (!productId || !fromLocationId || !toLocationId) {
      setError('Select a product, source, and destination location.');
      return;
    }
    if (fromLocationId === toLocationId) {
      setError('Source and destination must be different.');
      return;
    }
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setError('Enter a valid quantity.');
      return;
    }
    if (qty > availableAtFrom) {
      setError(`Only ${availableAtFrom} unit(s) available at the source location.`);
      return;
    }
    const ok = createTransfer(productId, fromLocationId, toLocationId, qty, reason, currentUser?.id ?? null);
    if (ok) setModalOpen(false);
  }

  const columns: DataTableColumn<StockTransfer>[] = [
    { key: 'createdAt', header: 'Date', sortable: true, render: (t) => formatDateTime(t.createdAt) },
    { key: 'productId', header: 'Product', render: (t) => products.find((p) => p.id === t.productId)?.name ?? 'Deleted product' },
    {
      key: 'fromLocationId',
      header: 'Route',
      render: (t) => (
        <span className="flex items-center gap-1.5 text-sm">
          <Badge tone="slate">{locations.find((l) => l.id === t.fromLocationId)?.name ?? '—'}</Badge>
          <ArrowRight className="h-3.5 w-3.5 text-slate2-400" />
          <Badge tone="market">{locations.find((l) => l.id === t.toLocationId)?.name ?? '—'}</Badge>
        </span>
      )
    },
    { key: 'quantity', header: 'Quantity', sortable: true },
    { key: 'reason', header: 'Reason', render: (t) => t.reason || '—' }
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink dark:text-slate2-50">Transfers</h1>
          <p className="text-sm text-slate2-400">Move stock between Store, Shop, and other locations.</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> New Transfer
        </Button>
      </div>

      {transfers.length === 0 ? (
        <EmptyState icon={<ArrowLeftRight className="h-8 w-8" />} title="No transfers yet" description="Move stock from the Store to the Shop (or back) and it'll show up here." actionLabel="New Transfer" onAction={openNew} />
      ) : (
        <DataTable columns={columns} data={transfers} pageSize={12} />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Transfer"
        size="sm"
        footer={
          <>
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1 sm:flex-none" onClick={submit}>
              Transfer
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Select label="Product" value={productId} onChange={(e) => setProductId(e.target.value)} options={products.map((p) => ({ value: p.id, label: p.name }))} placeholder="Select product" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="From" value={fromLocationId} onChange={(e) => setFromLocationId(e.target.value)} options={locations.map((l) => ({ value: l.id, label: l.name }))} />
            <Select label="To" value={toLocationId} onChange={(e) => setToLocationId(e.target.value)} options={locations.map((l) => ({ value: l.id, label: l.name }))} />
          </div>
          {productId && fromLocationId && <p className="text-xs text-slate2-400">{availableAtFrom} unit(s) available at the source location.</p>}
          <Input label="Quantity" type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <Input label="Reason / Note" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" />
          {error && <p className="text-xs text-tomato-500">{error}</p>}
        </div>
      </Modal>
    </div>
  );
}
