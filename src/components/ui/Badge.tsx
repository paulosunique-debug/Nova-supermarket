import React from 'react';
import { cn } from '../../utils/cn';

type Tone = 'market' | 'citrus' | 'slate' | 'tomato' | 'neutral';

const toneClasses: Record<Tone, string> = {
  market: 'bg-market-50 text-market-600 dark:bg-market-900/40 dark:text-market-200',
  citrus: 'bg-citrus-50 text-citrus-600 dark:bg-citrus-600/20 dark:text-citrus-200',
  slate: 'bg-slate2-100 text-slate2-600 dark:bg-slate2-700 dark:text-slate2-200',
  tomato: 'bg-tomato-50 text-tomato-600 dark:bg-tomato-500/20 dark:text-tomato-300',
  neutral: 'bg-slate2-50 text-slate2-500 dark:bg-slate2-700 dark:text-slate2-300'
};

export function Badge({ tone = 'neutral', className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-tag px-2 py-0.5 text-xs font-medium', toneClasses[tone], className)}>
      {children}
    </span>
  );
}
