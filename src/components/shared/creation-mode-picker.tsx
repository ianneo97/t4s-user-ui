import { Zap, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

export type CreationMode = 'quick' | 'full'

interface CreationModePickerProps {
  value: CreationMode
  onChange: (mode: CreationMode) => void
  quickTitle?: string
  quickDescription?: string
  fullTitle?: string
  fullDescription?: string
}

export function CreationModePicker({
  value,
  onChange,
  quickTitle = 'Quick Add',
  quickDescription = 'Just the essentials. Fill in details later.',
  fullTitle = 'Full Details',
  fullDescription = 'Complete all information now.',
}: CreationModePickerProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => onChange('quick')}
        className={cn(
          'group relative rounded-2xl border-2 p-5 text-left transition-all',
          value === 'quick'
            ? 'border-accent bg-accent/5'
            : 'border-border/60 hover:border-border hover:bg-card/50'
        )}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors',
              value === 'quick'
                ? 'bg-accent text-accent-foreground'
                : 'bg-secondary text-muted-foreground group-hover:bg-secondary/80'
            )}
          >
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold">{quickTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {quickDescription}
            </p>
          </div>
        </div>
        {value === 'quick' && (
          <div className="absolute right-3 top-3 h-3 w-3 rounded-full bg-accent" />
        )}
      </button>

      <button
        type="button"
        onClick={() => onChange('full')}
        className={cn(
          'group relative rounded-2xl border-2 p-5 text-left transition-all',
          value === 'full'
            ? 'border-accent bg-accent/5'
            : 'border-border/60 hover:border-border hover:bg-card/50'
        )}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors',
              value === 'full'
                ? 'bg-accent text-accent-foreground'
                : 'bg-secondary text-muted-foreground group-hover:bg-secondary/80'
            )}
          >
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold">{fullTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {fullDescription}
            </p>
          </div>
        </div>
        {value === 'full' && (
          <div className="absolute right-3 top-3 h-3 w-3 rounded-full bg-accent" />
        )}
      </button>
    </div>
  )
}
