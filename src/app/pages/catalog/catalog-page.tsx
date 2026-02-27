import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Command,
  FileText,
  Layers,
  Package,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  Workflow,
  X,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  getCachedMaterials,
  getCachedProducts,
} from '@/infrastructure/cache/catalog-cache'
import { cn } from '@/lib/utils'

type CatalogItem =
  | { type: 'product'; data: ReturnType<typeof getCachedProducts>[number] }
  | { type: 'component'; data: ReturnType<typeof getCachedMaterials>[number] }

function formatRelativeTime(isoString?: string): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function CommandPalette({
  open,
  onOpenChange,
  items,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: CatalogItem[]
  onSelect: (item: CatalogItem) => void
}) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    if (!query.trim()) return items.slice(0, 6)
    const q = query.toLowerCase()
    return items
      .filter((item) => {
        if (item.type === 'product') {
          return (
            item.data.name.toLowerCase().includes(q) ||
            item.data.upc.toLowerCase().includes(q) ||
            item.data.categoryType?.toLowerCase().includes(q)
          )
        }
        return (
          item.data.name.toLowerCase().includes(q) ||
          item.data.description?.toLowerCase().includes(q)
        )
      })
      .slice(0, 8)
  }, [items, query])

  const actions = [
    {
      id: 'new-product',
      label: 'Create Product',
      icon: Package,
      shortcut: 'P',
      action: () => navigate('/catalog/products/builder'),
    },
    {
      id: 'new-component',
      label: 'Create Component',
      icon: Layers,
      shortcut: 'C',
      action: () => navigate('/catalog/components/create'),
    },
  ]

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="overflow-hidden p-0 sm:max-w-xl"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center border-b border-border/60 px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, components, or type a command..."
            className="h-14 flex-1 bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground/60"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="max-h-[360px] overflow-y-auto p-2">
          {!query && (
            <div className="mb-2">
              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Quick Actions
              </p>
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => {
                    action.action()
                    onOpenChange(false)
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-secondary/80"
                >
                  <div className="grid h-8 w-8 place-items-center rounded-md bg-accent/10">
                    <action.icon className="h-4 w-4 text-accent" />
                  </div>
                  <span className="flex-1 text-sm font-medium">
                    {action.label}
                  </span>
                  <kbd className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {action.shortcut}
                  </kbd>
                </button>
              ))}
            </div>
          )}

          {filtered.length > 0 && (
            <div>
              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                {query ? 'Results' : 'Recent Items'}
              </p>
              {filtered.map((item) => {
                const isProduct = item.type === 'product'
                const Icon = isProduct ? Package : Layers
                const name = item.data.name
                const meta = isProduct
                  ? `${(item.data as any).categoryType} · ${(item.data as any).bom?.items?.length || 0} BOM`
                  : `${(item.data as any).weight}g · ${(item.data as any).substances?.length || 0} substances`

                return (
                  <button
                    key={`${item.type}-${item.data.id}`}
                    onClick={() => {
                      onSelect(item)
                      onOpenChange(false)
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-secondary/80"
                  >
                    <div
                      className={cn(
                        'grid h-8 w-8 place-items-center rounded-md',
                        isProduct ? 'bg-secondary/80' : 'bg-accent/10'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4',
                          isProduct ? 'text-muted-foreground' : 'text-accent'
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {meta}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {isProduct ? 'Product' : 'Component'}
                    </Badge>
                  </button>
                )
              })}
            </div>
          )}

          {query && filtered.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No results for "{query}"
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border/60 bg-secondary/30 px-4 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-secondary px-1 py-0.5 font-mono">
                ↑↓
              </kbd>{' '}
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-secondary px-1 py-0.5 font-mono">
                ↵
              </kbd>{' '}
              select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-secondary px-1 py-0.5 font-mono">
              esc
            </kbd>{' '}
            close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StatCard({
  label,
  value,
  trend,
  icon: Icon,
}: {
  label: string
  value: number
  trend?: string
  icon: React.ElementType
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/40 px-4 py-3 backdrop-blur-sm">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-secondary/60">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      {trend && (
        <div className="ml-auto flex items-center gap-1 text-xs text-emerald-600">
          <TrendingUp className="h-3 w-3" />
          {trend}
        </div>
      )}
    </div>
  )
}

function ItemRow({
  item,
  onNavigate,
}: {
  item: CatalogItem
  onNavigate: (item: CatalogItem) => void
}) {
  const isProduct = item.type === 'product'
  const Icon = isProduct ? Package : Layers
  const data = item.data

  const name = data.name
  const meta = isProduct
    ? (data as any).categoryType
    : `${(data as any).unitCostCurrency} ${(data as any).unitCost?.toFixed(2)}`
  const secondary = isProduct
    ? `${(data as any).bom?.items?.length || 0} components`
    : `${(data as any).substances?.length || 0} substances`
  const time = formatRelativeTime(data.updatedAt)

  return (
    <button
      onClick={() => onNavigate(item)}
      className="group flex w-full items-center gap-4 rounded-xl border border-transparent px-4 py-3 text-left transition-all duration-150 hover:border-border/60 hover:bg-card/60 hover:shadow-sm active:scale-[0.995]"
    >
      <div
        className={cn(
          'grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors',
          isProduct
            ? 'bg-secondary/70 group-hover:bg-secondary'
            : 'bg-accent/10 group-hover:bg-accent/15'
        )}
      >
        <Icon
          className={cn(
            'h-4 w-4',
            isProduct ? 'text-muted-foreground' : 'text-accent'
          )}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{name}</span>
          {isProduct && (data as any).isActive && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          )}
        </div>
        <p className="truncate text-sm text-muted-foreground">{meta}</p>
      </div>

      <div className="hidden items-center gap-6 md:flex">
        <span className="flex min-w-[100px] items-center gap-1.5 text-sm text-muted-foreground">
          {isProduct ? (
            <Workflow className="h-3.5 w-3.5" />
          ) : (
            <FileText className="h-3.5 w-3.5" />
          )}
          {secondary}
        </span>
        <span className="min-w-[60px] text-right text-xs text-muted-foreground/70">
          {time}
        </span>
      </div>

      <ArrowRight className="h-4 w-4 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
    </button>
  )
}

function EmptyState({ onOpenPalette }: { onOpenPalette: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative">
        <div className="absolute inset-0 animate-pulse rounded-full bg-accent/10 blur-3xl" />
        <div className="relative grid h-20 w-20 place-items-center rounded-2xl border border-border/60 bg-card/80 shadow-lg">
          <Package className="h-8 w-8 text-muted-foreground/60" />
        </div>
      </div>

      <h2 className="mt-8 text-2xl">Your inventory is empty</h2>
      <p className="mt-2 max-w-sm text-muted-foreground">
        Get started by creating your first product or component.
      </p>

      <div className="mt-8 flex gap-3">
        <Button asChild variant="outline" className="gap-2">
          <Link to="/catalog/components/create">
            <Layers className="h-4 w-4" />
            New Component
          </Link>
        </Button>
        <Button asChild variant="accent" className="gap-2">
          <Link to="/catalog/products/builder">
            <Plus className="h-4 w-4" />
            New Product
          </Link>
        </Button>
      </div>

      <button
        onClick={onOpenPalette}
        className="mt-6 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Command className="h-3.5 w-3.5" />
        <span>Press</span>
        <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-xs">
          ⌘K
        </kbd>
        <span>for quick actions</span>
      </button>
    </div>
  )
}

import { useWorkspace } from '@/app/contexts/workspace-context'

export function CatalogPage() {
  const navigate = useNavigate()
  const { activeWorkspace } = useWorkspace()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'products' | 'components'>('all')

  const products = useMemo(() => {
    return getCachedProducts().filter(
      (p) => !p.workspaceId || p.workspaceId === activeWorkspace.id
    )
  }, [activeWorkspace.id])

  const materials = useMemo(() => {
    return getCachedMaterials().filter(
      (m) => !m.workspaceId || m.workspaceId === activeWorkspace.id
    )
  }, [activeWorkspace.id])

  const allItems: CatalogItem[] = useMemo(() => {
    const productItems: CatalogItem[] = products.map((p) => ({
      type: 'product',
      data: p,
    }))
    const componentItems: CatalogItem[] = materials.map((m) => ({
      type: 'component',
      data: m,
    }))
    return [...productItems, ...componentItems].sort((a, b) => {
      const aTime = new Date(a.data.updatedAt || 0).getTime()
      const bTime = new Date(b.data.updatedAt || 0).getTime()
      return bTime - aTime
    })
  }, [products, materials])

  const filteredItems = useMemo(() => {
    if (filter === 'all') return allItems
    if (filter === 'products')
      return allItems.filter((i) => i.type === 'product')
    return allItems.filter((i) => i.type === 'component')
  }, [allItems, filter])

  const stats = {
    products: products.length,
    components: materials.length,
    withBom: products.filter((p) => (p.bom?.items?.length || 0) > 0).length,
  }

  const handleNavigate = useCallback(
    (item: CatalogItem) => {
      if (item.type === 'product') {
        navigate(`/catalog/products/${item.data.id}`)
      } else {
        navigate(`/catalog/components/${item.data.id}`)
      }
    },
    [navigate]
  )

  // Keyboard shortcut: Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setPaletteOpen(true)
      }
      // Quick create shortcuts when palette is closed
      if (!paletteOpen) {
        if (e.key === 'p' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
          e.preventDefault()
          navigate('/catalog/products/builder')
        }
        if (e.key === 'c' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
          e.preventDefault()
          navigate('/catalog/components/create')
        }
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [paletteOpen, navigate])

  const isEmpty = allItems.length === 0

  return (
    <div className="min-h-screen pb-16">
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        items={allItems}
        onSelect={handleNavigate}
      />

      {/* Header */}
      <header className="border-b border-border/40">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Catalog
              </div>
              <h1 className="mt-1 text-3xl tracking-tight">Inventory</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaletteOpen(true)}
                className="flex h-9 items-center gap-2 rounded-lg border border-border/60 bg-card/50 px-3 text-sm text-muted-foreground transition-colors hover:border-border hover:bg-card hover:text-foreground"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Search...</span>
                <kbd className="ml-2 hidden rounded border border-border/60 bg-secondary/80 px-1.5 py-0.5 font-mono text-[10px] sm:inline">
                  ⌘K
                </kbd>
              </button>

              <Button asChild variant="accent" size="sm" className="gap-1.5">
                <Link to="/catalog/products/builder">
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">New</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          {!isEmpty && (
            <div className="mt-6 grid grid-cols-3 gap-3">
              <StatCard
                label="Products"
                value={stats.products}
                icon={Package}
              />
              <StatCard
                label="Components"
                value={stats.components}
                icon={Layers}
              />
              <StatCard
                label="With BOM"
                value={stats.withBom}
                icon={Workflow}
              />
            </div>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {isEmpty ? (
          <EmptyState onOpenPalette={() => setPaletteOpen(true)} />
        ) : (
          <>
            {/* Filter pills */}
            <div className="mb-4 flex items-center gap-2">
              {(['all', 'products', 'components'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                    filter === f
                      ? 'bg-foreground text-background'
                      : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  {f === 'all' && 'All'}
                  {f === 'products' && `Products (${stats.products})`}
                  {f === 'components' && `Components (${stats.components})`}
                </button>
              ))}
            </div>

            {/* Items list */}
            <div className="space-y-1">
              {filteredItems.map((item) => (
                <ItemRow
                  key={`${item.type}-${item.data.id}`}
                  item={item}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                No {filter} found
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
