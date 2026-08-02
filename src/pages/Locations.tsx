import { useState } from 'react';
import { Plus, Pencil, Trash2, Store, MapPin } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { useLocationStore } from '../stores/useLocationStore';
import { useProductStore } from '../stores/useProductStore';
import { stockAt } from '../utils/stock';
import type { Location } from '../types';

const emptyForm = { name: '', type: 'store' as Location['type'], address: '' };

export default function Locations() {
  const locations = useLocationStore((s) => s.locations);
  const addLocation = useLocationStore((s) => s.add);
  const updateLocation = useLocationStore((s) => s.update);
  const removeLocation = useLocationStore((s) => s.remove);
  const products = useProductStore((s) => s.products);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [nameError, setNameError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setNameError('');
    setModalOpen(true);
  }
  function openEdit(l: Location) {
    setEditing(l);
    setForm({ name: l.name, type: l.type, address: l.address });
    setNameError('');
    setModalOpen(true);
  }
  function save() {
    if (!form.name.trim()) {
      setNameError('Location name is required');
      return;
    }
    if (editing) updateLocation(editing.id, form);
    else addLocation(form);
    setModalOpen(false);
  }

  function productCount(locationId: string) {
    return products.filter((p) => stockAt(p, locationId) > 0).length;
  }
  function totalUnits(locationId: string) {
    return products.reduce((sum, p) => sum + stockAt(p, locationId), 0);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink dark:text-slate2-50">Locations</h1>
          <p className="text-sm text-slate2-400">{locations.length} locations holding inventory — e.g. Store and Shop.</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> Add Location
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {locations.map((l) => (
          <Card key={l.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-market-50 text-market-600 dark:bg-market-900/40">
                <Store className="h-5 w-5" />
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(l)} className="rounded-lg p-1.5 text-slate2-400 hover:bg-slate2-100 dark:hover:bg-slate2-700">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setDeleteTarget(l)} className="rounded-lg p-1.5 text-slate2-400 hover:bg-tomato-50 hover:text-tomato-500 dark:hover:bg-tomato-500/10">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <p className="mt-3 font-display text-sm font-semibold text-ink dark:text-slate2-50">{l.name}</p>
            <p className="mb-2 flex items-center gap-1 text-xs text-slate2-400">
              <MapPin className="h-3 w-3" /> {l.address || 'No address set'}
            </p>
            <div className="flex gap-2">
              <Badge tone="market">{productCount(l.id)} products</Badge>
              <Badge tone="citrus">{totalUnits(l.id)} units</Badge>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Location' : 'Add Location'}
        size="sm"
        footer={
          <>
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1 sm:flex-none" onClick={save}>{editing ? 'Save Changes' : 'Add Location'}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Input label="Location Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={nameError} placeholder="e.g. Store, Shop, Warehouse 2" />
          <Select
            label="Type"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as Location['type'] }))}
            options={[{ value: 'store', label: 'Store (back stock)' }, { value: 'shop', label: 'Shop (retail floor)' }, { value: 'other', label: 'Other' }]}
          />
          <Input label="Address / Notes" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && removeLocation(deleteTarget.id)}
        title="Delete this location?"
        description="Any remaining stock recorded at this location will no longer be tracked. Transfer it out first if needed."
      />
    </div>
  );
}
