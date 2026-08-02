import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  danger = true
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-tomato-50 text-tomato-500 dark:bg-tomato-500/10">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h3 className="font-display text-base font-semibold text-ink dark:text-slate2-50">{title ?? 'Are you sure?'}</h3>
        <p className="mt-1 text-sm text-slate2-400">{description ?? 'This action cannot be undone.'}</p>
        <div className="mt-5 flex w-full flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {t('common_cancel')}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} className="flex-1" onClick={() => { onConfirm(); onClose(); }}>
            {confirmLabel ?? t('common_delete')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
