import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        'flex h-4 w-4 items-center justify-center rounded border transition-colors',
        checked ? 'border-market-500 bg-market-500 text-white' : 'border-slate2-300 bg-white dark:border-slate2-500 dark:bg-slate2-800'
      )}
    >
      {checked && <Check className="h-3 w-3" />}
    </button>
  );
}
