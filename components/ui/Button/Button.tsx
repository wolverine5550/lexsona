'use client';

import { cn } from '@/utils/cn';
import { forwardRef } from 'react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'flat' | 'slim' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size = 'default', loading, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

    const variants = {
      default: 'bg-blue-500 text-white hover:bg-blue-600',
      flat: 'text-zinc-100 hover:bg-zinc-800',
      slim: 'bg-zinc-900 text-zinc-100 hover:bg-zinc-800',
      outline: 'border border-zinc-700 bg-transparent hover:bg-zinc-800'
    };

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 px-3 text-sm',
      lg: 'h-12 px-6 text-lg'
    };

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant || 'default'],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export default Button;
