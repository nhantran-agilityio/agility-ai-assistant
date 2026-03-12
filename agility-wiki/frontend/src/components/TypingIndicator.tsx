import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type TypingIndicatorProps = HTMLAttributes<HTMLDivElement> & {
  size?: number;
};

export const TypingIndicator = ({
  className,
  size = 8,
  ...props
}: TypingIndicatorProps) => {
  const style = {
    width: size,
    height: size,
  };

  return (
    <div
      className={cn('flex items-center gap-1 px-2 py-1', className)}
      {...props}
    >
      <span
        className="animate-bounce rounded-full bg-gray-400"
        style={{ ...style, animationDelay: '0ms' }}
      />
      <span
        className="animate-bounce rounded-full bg-gray-400"
        style={{ ...style, animationDelay: '150ms' }}
      />
      <span
        className="animate-bounce rounded-full bg-gray-400"
        style={{ ...style, animationDelay: '300ms' }}
      />
    </div>
  );
};
