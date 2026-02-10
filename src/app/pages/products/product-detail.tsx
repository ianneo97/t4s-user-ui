import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpRight,
  Beaker,
  ChevronRight,
  Edit3,
  FileText,
  FlaskConical,
  Layers,
  MoreHorizontal,
  Package,
  Percent,
  Scale,
  Workflow,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  getCachedMaterialById,
  getCachedProductById,
  type CachedMaterial,
  type CachedProductBomItem,
} from '@/infrastructure/cache/catalog-cache'
import { cn } from '@/lib/utils'

type ViewMode = 'bom' | 'substances'

interface AggregatedSubstance {
  substanceCode: string
  substanceName: string
  totalPercentage: number
  totalWeight: number
  sources: Array<{
    materialId: string
    materialName: string
    percentage: number
    weight: number
  }>
}

function aggregateSubstances(
  bomItems: CachedProductBomItem[],
  getMaterial: (id: string) => CachedMaterial | null
): AggregatedSubstance[] {
  const substanceMap = new Map<string, AggregatedSubstance>()

  for (const bomItem of bomItems) {
    const material = getMaterial(bomItem.materialId)
    if (!material?.substances?.length) continue

    const bomPercentageMultiplier = bomItem.percentage / 100

    for (const substance of material.substances) {
      const key = substance.substanceCode || substance.substanceName
      const weightedPercentage = substance.percentage * bomPercentageMultiplier
      const weightedWeight = substance.projectedWeight * bomItem.quantity

      if (substanceMap.has(key)) {
        const existing = substanceMap.get(key)!
        existing.totalPercentage += weightedPercentage
        existing.totalWeight += weightedWeight
        existing.sources.push({
          materialId: material.id,
          materialName: material.name,
          percentage: substance.percentage,
          weight: substance.projectedWeight,
        })
      } else {
        substanceMap.set(key, {
          substanceCode: substance.substanceCode,
          substanceName: substance.substanceName,
          totalPercentage: weightedPercentage,
          totalWeight: weightedWeight,
          sources: [
            {
              materialId: material.id,
              materialName: material.name,
              percentage: substance.percentage,
              weight: substance.projectedWeight,
            },
          ],
        })
      }
    }
  }

  return Array.from(substanceMap.values()).sort(
    (a, b) => b.totalPercentage - a.totalPercentage
  )
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
  count: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
        active
          ? 'bg-foreground text-background shadow-lg'
          : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      <span
        className={cn(
          'rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
          active ? 'bg-background/20 text-background' : 'bg-secondary text-muted-foreground'
        )}
      >
        {count}
      </span>
    </button>
  )
}

function BOMItemCard({
  item,
  material,
}: {
  item: CachedProductBomItem
  material: CachedMaterial | null
}) {
  const substanceCount = material?.substances?.length || 0

  return (
    <div className="group relative rounded-2xl border border-border/60 bg-card/60 p-4 transition-all duration-200 hover:border-border hover:bg-card hover:shadow-sm">
      <div className="flex items-start gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-secondary/80 to-secondary/40">
          <Layers className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="truncate font-semibold">{item.materialName}</h4>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {item.unitCostCurrency} {item.unitCost.toFixed(2)} / {item.unitOfMeasurement}
              </p>
            </div>
            <Badge variant="outline" className="shrink-0 font-mono text-xs">
              {item.percentage.toFixed(1)}%
            </Badge>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Scale className="h-3.5 w-3.5" />
              <span>Qty: {item.quantity}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <FlaskConical className="h-3.5 w-3.5" />
              <span>{substanceCount} substance{substanceCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="font-medium">
              {item.unitCostCurrency} {(item.unitCost * item.quantity).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Composition bar */}
      <div className="mt-4">
        <div className="h-1.5 overflow-hidden rounded-full bg-secondary/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent/80 to-accent transition-all"
            style={{ width: `${Math.min(item.percentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function SubstanceCard({ substance }: { substance: AggregatedSubstance }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 transition-all duration-200 hover:border-border hover:bg-card">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 p-4 text-left"
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
          <Beaker className="h-4 w-4 text-emerald-600" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="truncate font-semibold">{substance.substanceName}</h4>
            {substance.substanceCode && (
              <Badge variant="secondary" className="shrink-0 font-mono text-[10px]">
                {substance.substanceCode}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            From {substance.sources.length} component{substance.sources.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-mono text-lg font-semibold tabular-nums">
              {substance.totalPercentage.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground">
              {substance.totalWeight.toFixed(2)}g
            </p>
          </div>
          <ChevronRight
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              expanded && 'rotate-90'
            )}
          />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/60 px-4 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Source Breakdown
          </p>
          <div className="space-y-2">
            {substance.sources.map((source, idx) => (
              <div
                key={`${source.materialId}-${idx}`}
                className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2 text-sm"
              >
                <span className="truncate text-muted-foreground">{source.materialName}</span>
                <span className="shrink-0 font-mono font-medium">
                  {source.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyBOM({ productId }: { productId: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 py-16">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-secondary/60">
        <Workflow className="h-7 w-7 text-muted-foreground/60" />
      </div>
      <h3 className="mt-5 text-xl font-semibold">No components added</h3>
      <p className="mt-2 max-w-sm text-center text-muted-foreground">
        Add materials to this product's bill of materials to track composition and costs.
      </p>
      <Button asChild variant="accent" className="mt-6 gap-2">
        <Link to={`/catalog/products/${productId}/bom`}>
          <Edit3 className="h-4 w-4" />
          Manage BOM
        </Link>
      </Button>
    </div>
  )
}

function EmptySubstances() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 py-16">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/10">
        <FlaskConical className="h-7 w-7 text-emerald-600/60" />
      </div>
      <h3 className="mt-5 text-xl font-semibold">No substances found</h3>
      <p className="mt-2 max-w-sm text-center text-muted-foreground">
        Substances are derived from components. Add components with substance data to see the aggregated bill of substances.
      </p>
    </div>
  )
}

export function ProductDetailPage() {
  const navigate = useNavigate()
  const { productId } = useParams<{ productId: string }>()
  const [viewMode, setViewMode] = useState<ViewMode>('bom')

  const product = useMemo(
    () => (productId ? getCachedProductById(productId) : null),
    [productId]
  )

  const bomItems = product?.bom?.items || []

  const aggregatedSubstances = useMemo(
    () => aggregateSubstances(bomItems, getCachedMaterialById),
    [bomItems]
  )

  const materialsMap = useMemo(() => {
    const map = new Map<string, CachedMaterial | null>()
    for (const item of bomItems) {
      if (!map.has(item.materialId)) {
        map.set(item.materialId, getCachedMaterialById(item.materialId))
      }
    }
    return map
  }, [bomItems])

  const totalComposition = bomItems.reduce((sum, item) => sum + item.percentage, 0)
  const totalCost = bomItems.reduce(
    (sum, item) => sum + item.unitCost * item.quantity,
    0
  )

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h2 className="mt-4 text-xl font-semibold">Product not found</h2>
          <p className="mt-2 text-muted-foreground">
            This product may have been deleted or doesn't exist.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/catalog">Back to Catalog</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-16">
      {/* Ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-40 top-[-10rem] h-[26rem] w-[26rem] rounded-full bg-[hsl(16_96%_58%/.12)] blur-3xl" />
        <div className="absolute right-[-12rem] top-[15%] h-[28rem] w-[28rem] rounded-full bg-[hsl(222_90%_56%/.10)] blur-3xl" />
        <div className="absolute bottom-[-8rem] left-[30%] h-[22rem] w-[22rem] rounded-full bg-[hsl(150_80%_45%/.08)] blur-3xl" />
        <div className="page-grain absolute inset-0 opacity-[0.25]" />
      </div>

      {/* Header */}
      <header className="border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => navigate('/catalog')}
                className="mt-1 h-9 w-9 shrink-0 rounded-lg"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wider">
                    Product
                  </Badge>
                  {product.isActive && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  )}
                </div>
                <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                  {product.name}
                </h1>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>{product.categoryType}</span>
                  <span>·</span>
                  <span className="font-mono">{product.upc}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="gap-2">
                <Link to={`/catalog/products/${productId}/bom`}>
                  <Edit3 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Edit BOM</span>
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="border-b border-border/40 bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 overflow-x-auto py-4">
            <div className="flex shrink-0 items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-background/80">
                <Workflow className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Components</p>
                <p className="font-semibold tabular-nums">{bomItems.length}</p>
              </div>
            </div>

            <div className="h-8 w-px bg-border/60" />

            <div className="flex shrink-0 items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-background/80">
                <Percent className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Composition</p>
                <p className={cn('font-semibold tabular-nums', totalComposition > 100 && 'text-destructive')}>
                  {totalComposition.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="h-8 w-px bg-border/60" />

            <div className="flex shrink-0 items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-background/80">
                <FlaskConical className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Substances</p>
                <p className="font-semibold tabular-nums">{aggregatedSubstances.length}</p>
              </div>
            </div>

            <div className="h-8 w-px bg-border/60" />

            <div className="flex shrink-0 items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-background/80">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Cost</p>
                <p className="font-semibold tabular-nums">USD {totalCost.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* View toggle */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1 rounded-xl bg-secondary/50 p-1">
            <TabButton
              active={viewMode === 'bom'}
              onClick={() => setViewMode('bom')}
              icon={Workflow}
              label="Bill of Materials"
              count={bomItems.length}
            />
            <TabButton
              active={viewMode === 'substances'}
              onClick={() => setViewMode('substances')}
              icon={FlaskConical}
              label="Bill of Substances"
              count={aggregatedSubstances.length}
            />
          </div>

          {viewMode === 'bom' && bomItems.length > 0 && (
            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <Link to={`/catalog/products/${productId}/bom`}>
                View full editor
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>

        {/* BOM View */}
        {viewMode === 'bom' && (
          <div className="space-y-4">
            {bomItems.length === 0 ? (
              <EmptyBOM productId={productId!} />
            ) : (
              <>
                {/* Composition progress */}
                <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Composition</span>
                    <span
                      className={cn(
                        'font-mono font-semibold',
                        totalComposition > 100 && 'text-destructive'
                      )}
                    >
                      {totalComposition.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(totalComposition, 100)}
                    className={cn('mt-2 h-2', totalComposition > 100 && '[&>div]:!bg-destructive')}
                  />
                  {totalComposition > 100 && (
                    <p className="mt-2 text-xs font-medium text-destructive">
                      Composition exceeds 100%. Please adjust component percentages.
                    </p>
                  )}
                </div>

                {/* BOM items grid */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {bomItems.map((item) => (
                    <BOMItemCard
                      key={item.id}
                      item={item}
                      material={materialsMap.get(item.materialId) || null}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Substances View */}
        {viewMode === 'substances' && (
          <div className="space-y-3">
            {aggregatedSubstances.length === 0 ? (
              <EmptySubstances />
            ) : (
              aggregatedSubstances.map((substance) => (
                <SubstanceCard
                  key={substance.substanceCode || substance.substanceName}
                  substance={substance}
                />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
