import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-market-500 text-white hover:bg-market-600 active:bg-market-700 shadow-card',
  secondary: 'bg-slate2-100 text-slate2-800 hover:bg-slate2-200 dark:bg-slate2-700 dark:text-slate2-50 dark:hover:bg-slate2-600',
  ghost: 'bg-transparent text-slate2-600 hover:bg-slate2-100 dark:text-slate2-300 dark:hover:bg-slate2-800',
  danger: 'bg-tomato-500 text-white hover:bg-tomato-600',
  outline: 'bg-transparent border border-slate2-300 text-slate2-700 hover:bg-slate2-50 dark:border-slate2-600 dark:text-slate2-200 dark:hover:bg-slate2-800'
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2',
  icon: 'h-9 w-9 p-0 justify-center'
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center rounded-lg font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
