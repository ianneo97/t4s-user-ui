import { Link } from 'react-router-dom'
import { CheckCircle2, ArrowRight, Workflow, Eye } from 'lucide-react'

interface PostCreationPromptProps {
  entityType: 'product' | 'component'
  entityName: string
  entityId?: string
  onAddBom?: () => void
  onViewDetails?: () => void
  onGoToCatalog?: () => void
}

export function PostCreationPrompt({
  entityType,
  entityName,
  onAddBom,
  onViewDetails,
}: PostCreationPromptProps) {
  const isProduct = entityType === 'product'

  return (
    <div className="relative min-h-screen">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-32 top-[-8rem] h-[22rem] w-[22rem] rounded-full bg-[hsl(142_76%_36%/.16)] blur-3xl" />
        <div className="absolute right-[-8rem] top-[20%] h-[20rem] w-[20rem] rounded-full bg-[hsl(222_90%_56%/.12)] blur-3xl" />
        <div className="page-grain absolute inset-0 opacity-[0.28]" />
      </div>

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="animate-fade-up text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="mt-6 text-3xl sm:text-4xl">
            {isProduct ? 'Product' : 'Component'} Created
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            <span className="font-semibold text-foreground">{entityName}</span>{' '}
            has been saved to your catalog.
          </p>
        </div>

        <div className="animate-fade-up stagger-1 mt-10 space-y-4">
          {isProduct && (
            <button
              type="button"
              onClick={onAddBom}
              className="group flex w-full items-center gap-4 rounded-2xl border-2 border-accent/30 bg-accent/5 p-5 text-left transition-all hover:border-accent/50 hover:bg-accent/10"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Workflow className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Add Components (BOM)</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Define the bill of materials for this product
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-accent transition-transform group-hover:translate-x-1" />
            </button>
          )}

          <button
            type="button"
            onClick={onViewDetails}
            className="group flex w-full items-center gap-4 rounded-2xl border-2 border-border/60 bg-card/50 p-5 text-left transition-all hover:border-border hover:bg-card"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
              <Eye className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">View Details</p>
              <p className="mt-1 text-sm text-muted-foreground">
                See the full {isProduct ? 'product' : 'component'} profile
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </button>

          <Link
            to="/catalog"
            className="group flex w-full items-center gap-4 rounded-2xl border-2 border-border/60 bg-card/50 p-5 text-left transition-all hover:border-border hover:bg-card"
          >
            <div className="flex-1">
              <p className="font-semibold">Back to Catalog</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Continue browsing your products and components
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="animate-fade-up stagger-2 mt-8">
          <div className="rounded-xl border border-border/60 bg-card/50 p-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Tip:</span> You can
              always add or modify BOM components later from the{' '}
              {isProduct ? 'product' : 'component'} details page.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
