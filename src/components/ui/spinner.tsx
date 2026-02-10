import { cn } from '@/lib/utils'

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
}

export function Spinner({ size = 'md', className, ...props }: SpinnerProps) {
  return (
    <div
      className={cn('relative', sizeClasses[size], className)}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <div className="absolute inset-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-25" />
      <div
        className="absolute inset-0 animate-spin rounded-full border-2 border-current border-t-transparent"
        style={{ animationDuration: '0.6s' }}
      />
      <span className="sr-only">Loading...</span>
    </div>
  )
}
