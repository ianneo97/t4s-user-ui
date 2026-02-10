import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Layers,
  Plus,
  Trash2,
  Search,
  Package,
  GripVertical,
  ArrowLeft,
  Save,
  Percent,
  Hash,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  getCachedMaterials,
  getCachedProductById,
  saveProductBomToCache,
} from '@/infrastructure/cache/catalog-cache'
import { cn } from '@/lib/utils'

// Types
interface Material {
  id: string
  name: string
  unitOfMeasurement: string
  unitCost: number
  unitCostCurrency: string
}

interface BOMItem {
  id: string
  material: Material
  quantity: number
  percentage: number
}

// Components
function MaterialCard({
  material,
  onAdd,
  isAdded,
}: {
  material: Material
  onAdd: (material: Material) => void
  isAdded: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => !isAdded && onAdd(material)}
      disabled={isAdded}
      className={cn(
        'group flex items-center gap-4 rounded-2xl border border-border/85 bg-card/75 p-4 text-left shadow-[0_16px_26px_-24px_hsl(var(--primary)/0.45)] transition-all',
        isAdded
          ? 'cursor-not-allowed bg-secondary/55 opacity-60'
          : 'hover:-translate-y-0.5 hover:border-foreground/25 hover:bg-card'
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/80">
        <Layers className="h-6 w-6 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold">{material.name}</p>
        <p className="text-xs text-muted-foreground">
          {material.unitCostCurrency} {material.unitCost.toFixed(2)} /{' '}
          {material.unitOfMeasurement}
        </p>
      </div>

      {isAdded ? (
        <Badge variant="secondary" className="font-semibold">
          Added
        </Badge>
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground opacity-0 transition-opacity group-hover:opacity-100">
          <Plus className="h-4 w-4" />
        </div>
      )}
    </button>
  )
}

function BOMItemRow({
  item,
  onUpdate,
  onRemove,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
}: {
  item: BOMItem
  onUpdate: (id: string, updates: Partial<BOMItem>) => void
  onRemove: (id: string) => void
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDragEnd: () => void
  isDragging: boolean
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={cn(
        'group flex flex-wrap items-center gap-3 rounded-2xl border border-border/85 bg-card/80 p-4 shadow-[0_16px_26px_-24px_hsl(var(--primary)/0.45)] transition-all sm:flex-nowrap',
        isDragging && 'scale-[0.98] opacity-50'
      )}
    >
      <div className="cursor-grab text-muted-foreground/50 transition-colors hover:text-muted-foreground">
        <GripVertical className="h-5 w-5" />
      </div>

      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/80">
        <Layers className="h-6 w-6 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold">{item.material.name}</p>
        <p className="text-xs text-muted-foreground">
          {item.material.unitCostCurrency} {item.material.unitCost.toFixed(2)} /{' '}
          {item.material.unitOfMeasurement}
        </p>
      </div>

      <div className="flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto sm:flex-nowrap">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="number"
              min={0}
              step={0.01}
              value={item.quantity}
              onChange={(e) =>
                onUpdate(item.id, { quantity: Number(e.target.value) })
              }
              className="h-10 w-24 rounded-lg pl-9 text-center"
              placeholder="Qty"
            />
          </div>

          <div className="relative">
            <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={item.percentage}
              onChange={(e) =>
                onUpdate(item.id, { percentage: Number(e.target.value) })
              }
              className="h-10 w-24 rounded-lg pl-9 text-center"
              placeholder="%"
            />
          </div>
        </div>

        <div className="min-w-[92px] text-right">
          <p className="text-sm font-semibold">
            {item.material.unitCostCurrency}{' '}
            {(item.material.unitCost * item.quantity).toFixed(2)}
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(item.id)}
          className="h-9 w-9 shrink-0 text-muted-foreground opacity-70 transition-opacity hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Main component
export function ManageBOMPage() {
  const navigate = useNavigate()
  const { productId } = useParams()

  const [bomItems, setBomItems] = useState<BOMItem[]>([])
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([])
  const [productName, setProductName] = useState('Product')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const loadAvailableMaterials = useCallback(() => {
    const materials = getCachedMaterials().map((material) => ({
      id: material.id,
      name: material.name,
      unitOfMeasurement: material.unitOfMeasurement,
      unitCost: material.unitCost,
      unitCostCurrency: material.unitCostCurrency,
    }))
    setAvailableMaterials(materials)
    return materials
  }, [])

  useEffect(() => {
    const materials = loadAvailableMaterials()

    if (!productId) {
      setBomItems([])
      setProductName('Product')
      return
    }

    const product = getCachedProductById(productId)
    if (!product) {
      setBomItems([])
      setProductName('Product')
      return
    }

    setProductName(product.name)

    const materialMap = new Map(materials.map((material) => [material.id, material]))
    const existingBomItems: BOMItem[] = (product.bom?.items || []).map((item) => ({
      id: item.id,
      material:
        materialMap.get(item.materialId) || {
          id: item.materialId,
          name: item.materialName,
          unitOfMeasurement: item.unitOfMeasurement,
          unitCost: item.unitCost,
          unitCostCurrency: item.unitCostCurrency,
        },
      quantity: item.quantity,
      percentage: item.percentage,
    }))
    setBomItems(existingBomItems)
  }, [loadAvailableMaterials, productId])

  // Filter materials based on search
  const filteredMaterials = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return availableMaterials.filter((m) =>
      m.name.toLowerCase().includes(query)
    )
  }, [availableMaterials, searchQuery])

  // Check which materials are already added
  const addedMaterialIds = useMemo(() => {
    return new Set(bomItems.map((item) => item.material.id))
  }, [bomItems])

  // Calculate totals
  const totals = useMemo(() => {
    const cost = bomItems.reduce(
      (sum, item) => sum + item.material.unitCost * item.quantity,
      0
    )
    const percentage = bomItems.reduce((sum, item) => sum + item.percentage, 0)
    return { cost, percentage }
  }, [bomItems])

  const handleAddMaterial = useCallback((material: Material) => {
    setBomItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        material,
        quantity: 1,
        percentage: 0,
      },
    ])
  }, [])

  const openMaterialPicker = () => {
    loadAvailableMaterials()
    setIsDialogOpen(true)
  }

  const handleUpdateItem = useCallback(
    (id: string, updates: Partial<BOMItem>) => {
      setBomItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      )
    },
    []
  )

  const handleRemoveItem = useCallback((id: string) => {
    setBomItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  // Drag to reorder
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newItems = [...bomItems]
    const [draggedItem] = newItems.splice(draggedIndex, 1)
    newItems.splice(index, 0, draggedItem)
    setBomItems(newItems)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleSave = async () => {
    if (!productId) {
      toast.error('Missing product context for BOM save')
      return
    }

    if (totals.percentage > 100) {
      toast.error('Total composition percentage cannot exceed 100%')
      return
    }

    setIsSaving(true)
    try {
      const savedProduct = saveProductBomToCache(
        productId,
        bomItems.map((item) => ({
          id: item.id,
          materialId: item.material.id,
          materialName: item.material.name,
          unitOfMeasurement: item.material.unitOfMeasurement,
          unitCost: item.material.unitCost,
          unitCostCurrency: item.material.unitCostCurrency,
          quantity: item.quantity,
          percentage: item.percentage,
        }))
      )

      if (!savedProduct) {
        toast.error('Unable to find product in local cache')
        return
      }

      toast.success(`BOM saved for "${savedProduct.name}"`)
      navigate('/products')
    } catch (error) {
      console.error('Failed to save BOM:', error)
      toast.error('Failed to save. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="relative min-h-screen pb-14">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-32 top-[-8rem] h-[24rem] w-[24rem] rounded-full bg-[hsl(16_96%_58%/.16)] blur-3xl" />
        <div className="absolute right-[-9rem] top-[16%] h-[24rem] w-[24rem] rounded-full bg-[hsl(222_90%_56%/.11)] blur-3xl" />
        <div className="page-grain absolute inset-0 opacity-[0.28]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-border/65 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => navigate(-1)}
                className="h-10 w-10 rounded-xl"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div>
                <h1 className="text-xl">Bill of Materials</h1>
                <p className="text-sm text-muted-foreground">
                  Compose materials for {productName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="accent"
                onClick={handleSave}
                disabled={isSaving || bomItems.length === 0}
                className="gap-2"
              >
                {isSaving ? (
                  <>
                    <Spinner size="sm" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save BOM
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              <div className="surface-panel rounded-3xl p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Composition
                    </p>
                    <h2 className="mt-2 text-3xl">Components</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {bomItems.length} component{bomItems.length !== 1 ? 's' : ''}{' '}
                      added
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={openMaterialPicker}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Component
                  </Button>
                </div>
              </div>

              {bomItems.length === 0 ? (
                <div className="surface-panel flex flex-col items-center justify-center rounded-3xl py-16">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/85">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mt-6 text-2xl">No components yet</h3>
                  <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
                    Add materials and components to build your product bill of
                    materials.
                  </p>
                  <Button
                    type="button"
                    variant="accent"
                    onClick={openMaterialPicker}
                    className="mt-6 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add First Component
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {bomItems.map((item, index) => (
                    <BOMItemRow
                      key={item.id}
                      item={item}
                      onUpdate={handleUpdateItem}
                      onRemove={handleRemoveItem}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      isDragging={draggedIndex === index}
                    />
                  ))}
                </div>
              )}
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="surface-panel rounded-3xl p-6">
                <h3 className="text-2xl">Summary</h3>

                <div className="mt-5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Composition</span>
                      <span
                        className={cn(
                          'font-semibold',
                          totals.percentage > 100 && 'text-destructive'
                        )}
                      >
                        {totals.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress
                      value={Math.min(totals.percentage, 100)}
                      className={cn(
                        'mt-2',
                        totals.percentage > 100 && '[&>div]:!bg-destructive'
                      )}
                    />
                    {totals.percentage > 100 && (
                      <p className="mt-1 text-xs font-semibold text-destructive">
                        Exceeds 100%. Adjust percentages before saving.
                      </p>
                    )}
                  </div>

                  <div className="h-px bg-border" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Cost</span>
                    <span className="text-xl font-semibold">
                      USD {totals.cost.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Components</span>
                    <span className="font-semibold">{bomItems.length}</span>
                  </div>
                </div>

                {bomItems.length > 0 && (
                  <>
                    <div className="my-6 h-px bg-border" />

                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Breakdown
                      </p>
                      {bomItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 rounded-xl bg-card/70 px-3 py-2 text-sm"
                        >
                          <span className="truncate text-muted-foreground">
                            {item.material.name}
                          </span>
                          <span className="font-semibold">
                            {(item.material.unitCost * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Add Component</DialogTitle>
            <DialogDescription>
              Select materials to include in this bill of materials.
            </DialogDescription>
          </DialogHeader>

          <div className="relative my-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="-mx-6 flex-1 overflow-y-auto px-6">
            <div className="grid gap-3">
              {filteredMaterials.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  onAdd={handleAddMaterial}
                  isAdded={addedMaterialIds.has(material.id)}
                />
              ))}

              {filteredMaterials.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  {availableMaterials.length === 0
                    ? 'No components found in cache. Create one first.'
                    : `No materials found matching "${searchQuery}".`}
                  {availableMaterials.length === 0 && (
                    <div className="mt-4">
                      <Button asChild variant="outline" size="sm" className="gap-2">
                        <Link to="/materials/create">
                          <Plus className="h-4 w-4" />
                          Create Component
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-end border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
