import { useState } from 'react';
import * as Icons from 'lucide-react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Card } from '../components/ui/Card';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useProductStore } from '../stores/useProductStore';
import { useTranslation } from '../hooks/useTranslation';
import type { Category } from '../types';
import { cn } from '../utils/cn';

const COLORS = ['#1F6D4C', '#E8A33D', '#B06E1A', '#C4453C', '#2E6F8E', '#4C6EF5', '#8B6F3E', '#3E9A6A', '#D6822A', '#5B6470', '#A15FB3', '#E88FA3'];
const ICON_OPTIONS = ['Carrot', 'Milk', 'Croissant', 'Beef', 'Fish', 'Snowflake', 'Wheat', 'CupSoda', 'Cookie', 'SprayCan', 'Sparkles', 'Baby', 'Package', 'Tags'];

function IconFor({ name, className }: { name: string; className?: string }) {
  const Icon = (Icons as any)[name] || Icons.Package;
  return <Icon className={className} />;
}

export default function Categories() {
  const categories = useCategoryStore((s) => s.categories);
  const addCategory = useCategoryStore((s) => s.add);
  const updateCategory = useCategoryStore((s) => s.update);
  const removeCategory = useCategoryStore((s) => s.remove);
  const products = useProductStore((s) => s.products);
  const { t } = useTranslation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState(ICON_OPTIONS[0]);
  const [nameError, setNameError] = useState('');

  function openNew() {
    setEditing(null);
    setName('');
    setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    setIcon(ICON_OPTIONS[0]);
    setNameError('');
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setName(cat.name);
    setColor(cat.color);
    setIcon(cat.icon);
    setNameError('');
    setModalOpen(true);
  }

  function save() {
    if (!name.trim()) {
      setNameError('Category name is required');
      return;
    }
    if (editing) {
      updateCategory(editing.id, { name, color, icon });
    } else {
      addCategory({ name, color, icon });
    }
    setModalOpen(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink dark:text-slate2-50">{t('categories_title')}</h1>
          <p className="text-sm text-slate2-400">{categories.length} {t('categories_subtitle')}</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" /> {t('categories_create')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((cat, i) => {
          const count = products.filter((p) => p.categoryId === cat.id).length;
          return (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: cat.color + '22', color: cat.color }}>
                    <IconFor name={cat.icon} className="h-5 w-5" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(cat)} className="rounded-lg p-1.5 text-slate2-400 hover:bg-slate2-100 dark:hover:bg-slate2-700">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(cat)} className="rounded-lg p-1.5 text-slate2-400 hover:bg-tomato-50 hover:text-tomato-500 dark:hover:bg-tomato-500/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="mt-3 truncate font-display text-sm font-semibold text-ink dark:text-slate2-50">{cat.name}</p>
                <p className="text-xs text-slate2-400">{count} {t('categories_products')}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('categories_edit') : t('categories_create')}
        size="sm"
        footer={
          <>
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setModalOpen(false)}>
              {t('common_cancel')}
            </Button>
            <Button className="flex-1 sm:flex-none" onClick={save}>{editing ? t('common_saveChanges') : t('categories_create')}</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input label={t('categories_name')} value={name} onChange={(e) => setName(e.target.value)} error={nameError} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate2-700 dark:text-slate2-200">{t('categories_color')}</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn('h-7 w-7 rounded-full ring-offset-2', color === c && 'ring-2 ring-slate2-800 dark:ring-slate2-100')}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate2-700 dark:text-slate2-200">{t('categories_icon')}</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg border',
                    icon === ic ? 'border-market-500 bg-market-50 text-market-600 dark:bg-market-900/40' : 'border-slate2-200 text-slate2-400 dark:border-slate2-600'
                  )}
                >
                  <IconFor name={ic} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && removeCategory(deleteTarget.id)}
        title="Delete this category?"
        description={`Products in "${deleteTarget?.name}" will remain but lose their category tag.`}
      />
    </div>
  );
}
