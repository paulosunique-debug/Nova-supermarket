import React from 'react';
import { cn } from '../../utils/cn';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate2-700 dark:text-slate2-200">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-lg border border-slate2-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-slate2-400 outline-none transition-colors focus:border-market-400 dark:border-slate2-600 dark:bg-slate2-800 dark:text-slate2-50',
            error && 'border-tomato-500 focus:border-tomato-500',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-tomato-500">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
