'use client';
import { type ComponentProps, memo } from 'react';
import { Streamdown } from 'streamdown';

import { cn } from '@/lib/utils';

type ResponseMessagesProps = ComponentProps<typeof Streamdown>;

export const ResponseMessages = memo(
  ({ className, ...props }: ResponseMessagesProps) => (
    <Streamdown
      className={cn(
        'size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
        className,
      )}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);

ResponseMessages.displayName = 'ResponseMessages';
