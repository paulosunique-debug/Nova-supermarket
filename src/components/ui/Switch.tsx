import { cn } from '../../utils/cn';

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={cn(
          'relative inline-block h-5 w-9 shrink-0 rounded-full border-0 p-0 transition-colors',
          checked ? 'bg-market-500' : 'bg-slate2-200 dark:bg-slate2-600'
        )}
      >
        <span
          className={cn(
            'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </button>
      {label && <span className="flex-1 text-sm text-slate2-600 dark:text-slate2-300">{label}</span>}
    </label>
  );
}
