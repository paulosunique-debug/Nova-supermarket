import React from 'react';
import { Button } from './Button';

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate2-200 py-14 text-center dark:border-slate2-700">
      {icon && <div className="mb-1 text-slate2-300">{icon}</div>}
      <p className="font-display text-sm font-semibold text-slate2-700 dark:text-slate2-200">{title}</p>
      {description && <p className="max-w-sm text-sm text-slate2-400">{description}</p>}
      {actionLabel && onAction && (
        <Button size="sm" className="mt-3" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
