import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Package,
  ArrowLeft,
  ArrowRight,
  Shirt,
  Footprints,
  Watch,
  Sparkles,
  Check,
  Edit3,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { createCachedProduct } from '@/infrastructure/cache/catalog-cache'
import { cn } from '@/lib/utils'

interface Template {
  id: string
  name: string
  icon: React.ElementType
  categoryType: string
  subCategory: string
  unitOfMeasure: string
  examples: string[]
}

const TEMPLATES: Template[] = [
  {
    id: 't-shirt',
    name: 'T-Shirt',
    icon: Shirt,
    categoryType: 'Apparel',
    subCategory: 'T-Shirts',
    unitOfMeasure: 'piece',
    examples: ['Classic Cotton Tee', 'Graphic Print T-Shirt', 'V-Neck Basic'],
  },
  {
    id: 'pants',
    name: 'Pants',
    icon: Shirt,
    categoryType: 'Apparel',
    subCategory: 'Pants',
    unitOfMeasure: 'piece',
    examples: ['Slim Fit Chinos', 'Relaxed Denim Jeans', 'Cargo Pants'],
  },
  {
    id: 'jacket',
    name: 'Jacket',
    icon: Shirt,
    categoryType: 'Apparel',
    subCategory: 'Jackets',
    unitOfMeasure: 'piece',
    examples: ['Bomber Jacket', 'Denim Jacket', 'Rain Coat'],
  },
  {
    id: 'sneakers',
    name: 'Sneakers',
    icon: Footprints,
    categoryType: 'Footwear',
    subCategory: 'Sneakers',
    unitOfMeasure: 'pair',
    examples: ['Running Shoes', 'Casual Canvas Sneaker', 'High-Top Basketball'],
  },
  {
    id: 'boots',
    name: 'Boots',
    icon: Footprints,
    categoryType: 'Footwear',
    subCategory: 'Boots',
    unitOfMeasure: 'pair',
    examples: ['Leather Chelsea Boot', 'Work Boots', 'Ankle Boots'],
  },
  {
    id: 'accessories',
    name: 'Accessory',
    icon: Watch,
    categoryType: 'Accessories',
    subCategory: 'Bags',
    unitOfMeasure: 'piece',
    examples: ['Leather Tote Bag', 'Canvas Backpack', 'Crossbody Bag'],
  },
]

type Step = 'template' | 'customize'

export function CreateProductV4Page() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [name, setName] = useState('')
  const [upc, setUpc] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template)
    // Pre-fill with a suggested name
    setName(template.examples[0])
    setStep('customize')
  }

  const handleSubmit = useCallback(async () => {
    if (!selectedTemplate || !name.trim() || !upc.trim()) return

    setIsSubmitting(true)
    try {
      const created = createCachedProduct({
        name: name.trim(),
        upc: upc.trim(),
        categoryType: selectedTemplate.categoryType,
        subCategory: selectedTemplate.subCategory,
        sku: '',
        description: '',
        unitOfMeasure: selectedTemplate.unitOfMeasure,
        measureValue: 1,
        weight: undefined,
        color: '',
        collection: '',
        hsCode: '',
        externalReference: '',
        isActive: true,
        photos: [],
      })

      toast.success(`"${created.name}" created from template!`, {
        action: {
          label: 'Add BOM',
          onClick: () => navigate(`/v4/catalog/products/${created.id}/bom`),
        },
      })
      navigate('/v4/catalog')
    } catch (error) {
      console.error('Failed to create product:', error)
      toast.error('Unable to create product. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedTemplate, name, upc, navigate])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim() && upc.trim()) {
      handleSubmit()
    }
  }

  return (
    <div className="relative min-h-screen pb-24">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-32 top-[-8rem] h-[22rem] w-[22rem] rounded-full bg-[hsl(16_96%_58%/.16)] blur-3xl" />
        <div className="absolute right-[-8rem] top-[20%] h-[20rem] w-[20rem] rounded-full bg-[hsl(222_90%_56%/.12)] blur-3xl" />
        <div className="page-grain absolute inset-0 opacity-[0.28]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-border/65 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => (step === 'customize' ? setStep('template') : navigate('/v4'))}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">
                {step === 'template' ? 'Choose Template' : 'Customize Product'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {step === 'template' ? 'Start from a pre-built template' : 'Add your product details'}
              </p>
            </div>
          </div>

          {step === 'customize' && selectedTemplate && (
            <Badge variant="secondary" className="gap-1">
              <Check className="h-3 w-3" />
              {selectedTemplate.name}
            </Badge>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {step === 'template' ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
                <Sparkles className="h-7 w-7 text-accent" />
              </div>
              <h2 className="mt-4 text-2xl">What are you creating?</h2>
              <p className="mt-2 text-muted-foreground">
                Pick a template to get started quickly. Category and settings will be pre-filled.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TEMPLATES.map((template) => {
                const Icon = template.icon
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleSelectTemplate(template)}
                    className="group surface-panel flex flex-col items-start rounded-2xl p-5 text-left transition-all hover:shadow-lg"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                      <Icon className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{template.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {template.categoryType} / {template.subCategory}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {template.examples.slice(0, 2).map((ex) => (
                        <Badge key={ex} variant="secondary" className="text-xs">
                          {ex}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-sm font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                      Use this template
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-8 text-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/v4/catalog/products/create/custom')}
                className="gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Start from scratch
              </Button>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-xl">
            <div className="surface-panel rounded-3xl p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <Package className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="font-semibold">Product Details</p>
                  <p className="text-sm text-muted-foreground">
                    Just add name and barcode
                  </p>
                </div>
              </div>

              {selectedTemplate && (
                <div className="mb-6 flex flex-wrap gap-2 rounded-xl bg-secondary/50 p-3">
                  <Badge variant="outline">{selectedTemplate.categoryType}</Badge>
                  <Badge variant="outline">{selectedTemplate.subCategory}</Badge>
                  <Badge variant="outline">{selectedTemplate.unitOfMeasure}</Badge>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Product Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g., Classic Cotton T-Shirt"
                    autoFocus
                    className="h-12"
                  />
                  {selectedTemplate && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="text-xs text-muted-foreground">Suggestions:</span>
                      {selectedTemplate.examples.map((ex) => (
                        <button
                          key={ex}
                          type="button"
                          onClick={() => setName(ex)}
                          className={cn(
                            'rounded-full bg-secondary px-2 py-0.5 text-xs transition-colors hover:bg-secondary/80',
                            name === ex && 'bg-accent text-accent-foreground'
                          )}
                        >
                          {ex}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    EAN / UPC Barcode <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={upc}
                    onChange={(e) => setUpc(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g., 5901234123457"
                    className="h-12"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {step === 'customize' && (
        <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/65 bg-background/82 backdrop-blur-xl">
          <div className="mx-auto flex h-20 max-w-xl items-center justify-between px-4 sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('template')}
            >
              Change Template
            </Button>
            <Button
              type="button"
              variant="accent"
              onClick={handleSubmit}
              disabled={!name.trim() || !upc.trim() || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" />
                  Creating...
                </>
              ) : (
                <>
                  Create Product
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </footer>
      )}
    </div>
  )
}
