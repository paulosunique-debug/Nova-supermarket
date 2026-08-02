import { useEffect, useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { BarcodeScannerModal } from '../components/ui/BarcodeScannerModal';
import { Badge } from '../components/ui/Badge';
import { Image as ImageIcon, Barcode, RefreshCw, ScanLine } from 'lucide-react';
import { useProductStore } from '../stores/useProductStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useSupplierStore } from '../stores/useSupplierStore';
import { useLocationStore } from '../stores/useLocationStore';
import { useTranslation } from '../hooks/useTranslation';
import { generateBarcode, generateSKU } from '../utils/id';
import { round2 } from '../utils/currency';
import { getExpiryStatus, formatExpiryLabel } from '../utils/date';
import type { Product, Unit } from '../types';

const UNITS: Unit[] = ['pc', 'kg', 'g', 'l', 'ml', 'box', 'pack'];

interface Props {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
}

const emptyForm = {
  name: '',
  categoryId: '',
  supplierId: '',
  sku: '',
  barcode: '',
  costPrice: '',
  sellingPrice: '',
  taxRate: '0',
  unit: 'pc' as Unit,
  stockLocationId: '',
  stock: '0',
  reorderLevel: '10',
  batchNumber: '',
  expiryDate: '',
  description: '',
  imageUrl: null as string | null
};

export function ProductFormModal({ open, onClose, product }: Props) {
  const addProduct = useProductStore((s) => s.add);
  const updateProduct = useProductStore((s) => s.update);
  const categories = useCategoryStore((s) => s.categories);
  const suppliers = useSupplierStore((s) => s.suppliers);
  const locations = useLocationStore((s) => s.locations);
  const { t } = useTranslation();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [scannerOpen, setScannerOpen] = useState(false);

  useEffect(() => {
    if (open) {
      if (product) {
        setForm({
          name: product.name,
          categoryId: product.categoryId,
          supplierId: product.supplierId ?? '',
          sku: product.sku,
          barcode: product.barcode,
          costPrice: String(product.costPrice),
          sellingPrice: String(product.sellingPrice),
          taxRate: String(product.taxRate),
          unit: product.unit,
          stockLocationId: locations[0]?.id ?? '',
          stock: '0',
          reorderLevel: String(product.reorderLevel),
          batchNumber: product.batchNumber ?? '',
          expiryDate: product.expiryDate ?? '',
          description: product.description,
          imageUrl: product.imageUrl
        });
      } else {
        setForm({ ...emptyForm, categoryId: categories[0]?.id ?? '', stockLocationId: locations[0]?.id ?? '' });
      }
      setErrors({});
    }
  }, [open, product, categories, locations]);

  const margin =
    Number(form.sellingPrice) > 0 && Number(form.costPrice) >= 0
      ? round2(((Number(form.sellingPrice) - Number(form.costPrice)) / Number(form.sellingPrice)) * 100)
      : 0;

  const expiryStatus = getExpiryStatus(form.expiryDate || null);

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, imageUrl: reader.result as string }));
    reader.readAsDataURL(file);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Product name is required';
    if (!form.categoryId) errs.categoryId = 'Select a category';
    if (!form.costPrice || Number(form.costPrice) < 0) errs.costPrice = 'Enter a valid cost price';
    if (!form.sellingPrice || Number(form.sellingPrice) <= 0) errs.sellingPrice = 'Enter a valid selling price';
    if (!product && (form.stock === '' || Number(form.stock) < 0)) errs.stock = 'Enter a valid stock amount';
    if (!product && !form.stockLocationId) errs.stockLocationId = 'Select a location';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (product) {
      updateProduct(product.id, {
        name: form.name.trim(),
        categoryId: form.categoryId,
        supplierId: form.supplierId || null,
        costPrice: Number(form.costPrice),
        sellingPrice: Number(form.sellingPrice),
        taxRate: Number(form.taxRate),
        unit: form.unit,
        reorderLevel: Number(form.reorderLevel) || 10,
        batchNumber: form.batchNumber.trim(),
        expiryDate: form.expiryDate || null,
        description: form.description,
        imageUrl: form.imageUrl,
        sku: form.sku,
        barcode: form.barcode
      });
    } else {
      addProduct({
        name: form.name.trim(),
        categoryId: form.categoryId,
        supplierId: form.supplierId || null,
        costPrice: Number(form.costPrice),
        sellingPrice: Number(form.sellingPrice),
        taxRate: Number(form.taxRate),
        unit: form.unit,
        stockByLocation: { [form.stockLocationId]: Number(form.stock) },
        reorderLevel: Number(form.reorderLevel) || 10,
        batchNumber: form.batchNumber.trim(),
        expiryDate: form.expiryDate || null,
        description: form.description,
        imageUrl: form.imageUrl,
        sku: form.sku,
        barcode: form.barcode
      });
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product ? t('products_editProduct') : t('products_addProduct')}
      description={t('pf_saveNote')}
      size="lg"
      footer={
        <>
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={onClose}>
            {t('common_cancel')}
          </Button>
          <Button
            variant="secondary"
            className="flex-1 sm:flex-none"
            onClick={() =>
              setForm(
                product
                  ? {
                      name: product.name,
                      categoryId: product.categoryId,
                      supplierId: product.supplierId ?? '',
                      sku: product.sku,
                      barcode: product.barcode,
                      costPrice: String(product.costPrice),
                      sellingPrice: String(product.sellingPrice),
                      taxRate: String(product.taxRate),
                      unit: product.unit,
                      stockLocationId: locations[0]?.id ?? '',
                      stock: '0',
                      reorderLevel: String(product.reorderLevel),
                      batchNumber: product.batchNumber ?? '',
                      expiryDate: product.expiryDate ?? '',
                      description: product.description,
                      imageUrl: product.imageUrl
                    }
                  : { ...emptyForm, categoryId: categories[0]?.id ?? '' }
              )
            }
          >
            {t('common_reset')}
          </Button>
          <Button className="flex-1 sm:flex-none" onClick={handleSave}>
            {product ? t('common_saveChanges') : t('products_addProduct')}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-1">
          <label className="mb-1.5 block text-sm font-medium text-slate2-700 dark:text-slate2-200">{t('pf_productImage')}</label>
          <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate2-200 bg-slate2-50 text-slate2-400 hover:border-market-300 dark:border-slate2-600 dark:bg-slate2-900">
            {form.imageUrl ? (
              <img src={form.imageUrl} alt="preview" className="h-full w-full rounded-xl object-cover" />
            ) : (
              <>
                <ImageIcon className="mb-1 h-6 w-6" />
                <span className="text-xs">{t('pf_uploadImage')}</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:col-span-2">
          <Input
            label={t('pf_productName')}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={errors.name}
            className="sm:col-span-2"
          />
          <Select
            label={t('pf_category')}
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            placeholder={t('pf_selectCategory')}
            error={errors.categoryId}
          />
          <Select
            label={t('pf_supplier')}
            value={form.supplierId}
            onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))}
            options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
            placeholder={t('pf_noSupplier')}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div>
          <Input label={t('pf_sku')} value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} placeholder="Auto-generated" />
          <button
            type="button"
            className="mt-1 inline-flex items-center gap-1 text-xs text-market-600 hover:underline"
            onClick={() => setForm((f) => ({ ...f, sku: generateSKU(f.name || 'PROD') }))}
          >
            <RefreshCw className="h-3 w-3" /> {t('pf_generateSku')}
          </button>
        </div>
        <div>
          <Input label={t('pf_barcode')} value={form.barcode} onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))} placeholder="Auto-generated" />
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs text-market-600 hover:underline"
              onClick={() => setForm((f) => ({ ...f, barcode: generateBarcode() }))}
            >
              <Barcode className="h-3 w-3" /> {t('pf_generateBarcode')}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs text-market-600 hover:underline"
              onClick={() => setScannerOpen(true)}
            >
              <ScanLine className="h-3 w-3" /> {t('pf_scanBarcode')}
            </button>
          </div>
        </div>
        <Select label={t('pf_unit')} value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value as Unit }))} options={UNITS.map((u) => ({ value: u, label: u }))} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Input label={t('pf_costPrice')} type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))} error={errors.costPrice} />
        <Input label={t('pf_sellingPrice')} type="number" step="0.01" value={form.sellingPrice} onChange={(e) => setForm((f) => ({ ...f, sellingPrice: e.target.value }))} error={errors.sellingPrice} />
        <Input label={t('pf_taxRate')} type="number" step="0.5" value={form.taxRate} onChange={(e) => setForm((f) => ({ ...f, taxRate: e.target.value }))} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate2-700 dark:text-slate2-200">{t('pf_profitMargin')}</label>
          <div className="flex h-9 items-center rounded-lg bg-slate2-50 px-3 text-sm font-semibold text-market-600 dark:bg-slate2-900">
            {margin}%
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {product ? (
          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate2-700 dark:text-slate2-200">Stock by Location</label>
            <div className="flex flex-wrap gap-2">
              {locations.map((l) => (
                <span key={l.id} className="rounded-lg bg-slate2-50 px-2.5 py-1.5 text-xs text-slate2-600 dark:bg-slate2-900 dark:text-slate2-300">
                  {l.name}: <strong className="text-ink dark:text-slate2-50">{product.stockByLocation[l.id] ?? 0}</strong>
                </span>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-slate2-400">Use "Update Stock" or Transfers to change quantities.</p>
          </div>
        ) : (
          <>
            <Select label="Stock Location" value={form.stockLocationId} onChange={(e) => setForm((f) => ({ ...f, stockLocationId: e.target.value }))} options={locations.map((l) => ({ value: l.id, label: l.name }))} error={errors.stockLocationId} />
            <Input label={t('pf_initialStock')} type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} error={errors.stock} />
          </>
        )}
        <Input label={t('pf_reorderLevel')} type="number" value={form.reorderLevel} onChange={(e) => setForm((f) => ({ ...f, reorderLevel: e.target.value }))} />
        <Input label={t('pf_batchNumber')} value={form.batchNumber} onChange={(e) => setForm((f) => ({ ...f, batchNumber: e.target.value }))} placeholder="e.g. BN-2026-04" />
        <div>
          <Input
            label={t('pf_expiryDate')}
            type="date"
            value={form.expiryDate}
            onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
          />
          {form.expiryDate && expiryStatus !== 'ok' && (
            <div className="mt-1">
              <Badge tone={expiryStatus === 'expired' ? 'tomato' : 'citrus'}>{formatExpiryLabel(form.expiryDate)}</Badge>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <Textarea label={t('pf_description')} rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      </div>

      <BarcodeScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onDetected={(code) => setForm((f) => ({ ...f, barcode: code }))}
        title={t('pf_scanBarcode')}
      />
    </Modal>
  );
}
