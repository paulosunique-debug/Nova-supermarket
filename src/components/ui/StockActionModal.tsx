import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Input } from './Input';
import { Select } from './Select';
import { Button } from './Button';
import { useProductStore } from '../../stores/useProductStore';
import { useLocationStore } from '../../stores/useLocationStore';
import { stockAt } from '../../utils/stock';
import type { Product } from '../../types';

type Action = 'receive' | 'increase' | 'decrease';

interface Props {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}

const ACTION_LABELS: Record<Action, string> = {
  receive: 'Receive Stock',
  increase: 'Returned item back to stock',
  decrease: 'Decrease Stock (leak, damage, spoilage)'
};

export function StockActionModal({ open, onClose, product }: Props) {
  const locations = useLocationStore((s) => s.locations);
  const receiveStock = useProductStore((s) => s.receiveStock);
  const adjustStock = useProductStore((s) => s.adjustStock);

  const [action, setAction] = useState<Action>('receive');
  const [locationId, setLocationId] = useState('');
  const [qty, setQty] = useState('1');
  const [reason, setReason] = useState('');

  // Sales only ever happen from a Shop location, so a "returned item" must go
  // back into a Shop location's stock — never Store. Receiving and
  // leak/damage adjustments can happen at any location.
  const shopLocations = locations.filter((l) => l.type === 'shop');
  const locationOptions = action === 'increase' && shopLocations.length > 0 ? shopLocations : locations;

  useEffect(() => {
    if (open) {
      setAction('receive');
      setLocationId(locations[0]?.id ?? '');
      setQty('1');
      setReason('');
    }
  }, [open, locations]);

  useEffect(() => {
    if (!locationOptions.some((l) => l.id === locationId)) {
      setLocationId(locationOptions[0]?.id ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  if (!product) return null;

  const currentAtLocation = locationId ? stockAt(product, locationId) : 0;

  function submit() {
    if (!product) return;
    const n = Number(qty);
    if (!n || n <= 0 || !locationId) return;
    if (action === 'receive') receiveStock(product.id, locationId, n, reason || 'Stock received');
    else adjustStock(product.id, locationId, n, action, reason || (action === 'decrease' ? 'Leak, damage, or spoilage' : 'Sold item returned by customer'));
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Update Stock — ${product.name}`}
      description="Use this for leaks, damage, stock takes, restocks, or a sold item coming back."
      size="sm"
      footer={
        <>
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1 sm:flex-none" onClick={submit}>
            Confirm
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Select
          label="Action"
          value={action}
          onChange={(e) => setAction(e.target.value as Action)}
          options={[
            { value: 'receive', label: 'Receive new stock' },
            { value: 'increase', label: 'Increase (e.g. sold item returned)' },
            { value: 'decrease', label: 'Decrease (e.g. leak, damage, spoilage)' }
          ]}
        />
        <Select label="Location" value={locationId} onChange={(e) => setLocationId(e.target.value)} options={locationOptions.map((l) => ({ value: l.id, label: l.name }))} />
        {action === 'increase' && shopLocations.length > 0 && (
          <p className="text-xs text-slate2-400">Returned items go back into a Shop location — that's where the sale came from.</p>
        )}
        {locationId && <p className="text-xs text-slate2-400">Currently {currentAtLocation} {product.unit} at this location.</p>}
        <Input label="Quantity" type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
        <Input label="Reason / Note" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={ACTION_LABELS[action]} />
      </div>
    </Modal>
  );
}
