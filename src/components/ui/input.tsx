import * as React from 'react'

import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-12 w-full rounded-xl border bg-card/80 px-4 py-2.5 text-sm shadow-[0_10px_22px_-20px_hsl(var(--primary)/0.45)] transition-all duration-200',
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
Input.displayName = 'Input'

export { Input }
