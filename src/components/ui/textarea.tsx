import * as React from 'react'

import { cn } from '@/lib/utils'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[120px] w-full resize-none rounded-xl border bg-card/80 px-4 py-3 text-sm shadow-[0_10px_22px_-20px_hsl(var(--primary)/0.45)] transition-all duration-200',
          'placeholder:text-muted-foreground/70',
          'focus:outline-none focus:ring-2 focus:ring-ring/25 focus:border-ring/60',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-destructive focus:ring-destructive/20 focus:border-destructive'
            : 'border-input/90 hover:border-foreground/25',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
