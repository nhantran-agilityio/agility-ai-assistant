import * as React from 'react';
import { cn } from '../lib/utils';

type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';

type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

const baseStyles =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

const variantStyles: Record<ButtonVariant, string> = {
  default: 'bg-blue-500 text-white hover:bg-blue-400',
  destructive: 'bg-red-500 text-white hover:bg-red-400',
  outline:
    'border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-100',
  secondary: 'bg-zinc-700 text-white hover:bg-zinc-600',
  ghost: 'hover:bg-zinc-800 text-zinc-100',
  link: 'text-blue-400 underline-offset-4 hover:underline',
};

const sizeStyles: Record<ButtonSize, string> = {
  default: 'h-9 px-4 py-2',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-10 px-6',
  icon: 'h-9 w-9',
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
};

export function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: ButtonProps) {
  if (asChild && React.isValidElement(props.children)) {
    const child = props.children as React.ReactElement;
    return React.cloneElement(child, {
      className: cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        (child.props as any)?.className,
        className,
      ),
    } as any);
  }

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  );
}
