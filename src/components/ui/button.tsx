import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[0_16px_28px_-18px_hsl(var(--primary)/0.9)] hover:bg-primary/92 active:scale-[0.98]',
        destructive:
          'bg-destructive text-destructive-foreground shadow-[0_12px_24px_-16px_hsl(var(--destructive)/0.8)] hover:bg-destructive/90 active:scale-[0.98]',
        outline:
          'border border-border/90 bg-card/80 shadow-[0_14px_26px_-24px_hsl(var(--primary)/0.45)] hover:bg-secondary/75 hover:text-secondary-foreground active:scale-[0.98]',
        secondary:
          'bg-secondary/90 text-secondary-foreground shadow-[0_12px_20px_-18px_hsl(var(--primary)/0.45)] hover:bg-secondary active:scale-[0.98]',
        ghost: 'hover:bg-secondary/85 hover:text-secondary-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        accent:
          'bg-accent text-accent-foreground shadow-[0_18px_30px_-20px_hsl(var(--accent)/0.9)] hover:bg-accent/92 active:scale-[0.98]',
      },
      size: {
        default: 'h-11 rounded-xl px-5 py-2.5',
        sm: 'h-9 rounded-lg px-3.5 text-xs',
        lg: 'h-12 rounded-xl px-8 text-base',
        xl: 'h-14 rounded-2xl px-10 text-lg',
        icon: 'h-11 w-11 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
