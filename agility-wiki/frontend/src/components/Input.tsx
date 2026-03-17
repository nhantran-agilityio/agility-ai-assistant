import * as React from 'react';
import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'border-input h-9 w-full rounded-md border border-gray-300 bg-transparent px-3 py-1 text-base outline-none transition',
        'shadow-[0_1px_2px_rgba(0,0,0,0.05)]',
        'placeholder:text-gray-500 placeholder:leading-9',
        'focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500/30 focus-visible:shadow-[0_4px_8px_rgba(0,0,0,0.08)]',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
