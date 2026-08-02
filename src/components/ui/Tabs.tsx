import React from 'react';
import { cn } from '../../utils/cn';

export function Tabs({
  tabs,
  active,
  onChange
}: {
  tabs: { value: string; label: string; count?: number }[];
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg bg-slate2-50 p-1 dark:bg-slate2-900">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            active === t.value
              ? 'bg-white text-ink shadow-card dark:bg-slate2-700 dark:text-slate2-50'
              : 'text-slate2-500 hover:text-ink dark:hover:text-slate2-200'
          )}
        >
          {t.label}
          {typeof t.count === 'number' && (
            <span className="rounded-full bg-slate2-100 px-1.5 text-xs text-slate2-500 dark:bg-slate2-600 dark:text-slate2-200">
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
