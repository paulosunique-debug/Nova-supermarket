import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate2-700 dark:text-slate2-200">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate2-400">{leftIcon}</div>}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'h-9 w-full rounded-lg border border-slate2-200 bg-white px-3 text-sm text-ink placeholder:text-slate2-400 outline-none transition-colors focus:border-market-400 dark:border-slate2-600 dark:bg-slate2-800 dark:text-slate2-50',
              leftIcon && 'pl-9',
              error && 'border-tomato-500 focus:border-tomato-500',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-tomato-500">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-slate2-400">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
