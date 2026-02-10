import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Package,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Layers,
  FileText,
  Image,
  Tag,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { createCachedProduct } from '@/infrastructure/cache/catalog-cache'
import { cn } from '@/lib/utils'

const productSchema = z.object({
  // Required
  name: z.string().min(1, 'Product name is required'),
  upc: z.string().min(1, 'EAN/UPC barcode is required'),
  categoryType: z.string().min(1, 'Category is required'),
  subCategory: z.string().min(1, 'Sub-category is required'),
  // Optional details
  sku: z.string().optional(),
  description: z.string().optional(),
  unitOfMeasure: z.string().optional(),
  measureValue: z.coerce.number().optional(),
  weight: z.coerce.number().optional(),
  color: z.string().optional(),
  collection: z.string().optional(),
  hsCode: z.string().optional(),
  externalReference: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

const CATEGORY_TYPES = ['Apparel', 'Footwear', 'Accessories', 'Custom']
const SUB_CATEGORIES: Record<string, string[]> = {
  Apparel: ['T-Shirts', 'Pants', 'Jackets', 'Dresses', 'Sweaters'],
  Footwear: ['Sneakers', 'Boots', 'Sandals', 'Formal'],
  Accessories: ['Bags', 'Belts', 'Hats', 'Jewelry'],
  Custom: ['Custom Category'],
}
const UNITS = ['piece', 'pair', 'set', 'kg', 'meter']

interface SectionProps {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  defaultOpen?: boolean
}

function Section({ title, icon: Icon, children, defaultOpen = false }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-xl bg-secondary/50 px-4 py-3 text-left transition-colors hover:bg-secondary/70"
        >
          <div className="flex items-center gap-3">
            <Icon className="h-4 w-4 text-accent" />
            <span className="font-medium">{title}</span>
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}

export function CreateProductV2Page() {
  const navigate = useNavigate()

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      upc: '',
      categoryType: '',
      subCategory: '',
      sku: '',
      description: '',
      unitOfMeasure: 'piece',
      measureValue: 1,
      weight: undefined,
      color: '',
      collection: '',
      hsCode: '',
      externalReference: '',
    },
  })

  const categoryType = form.watch('categoryType')
  const subCategories = useMemo(() => SUB_CATEGORIES[categoryType] || [], [categoryType])

  const handleSubmit = useCallback(
    async (data: ProductFormData) => {
      try {
        const created = createCachedProduct({
          name: data.name,
          upc: data.upc,
          categoryType: data.categoryType,
          subCategory: data.subCategory,
          sku: data.sku || '',
          description: data.description || '',
          unitOfMeasure: data.unitOfMeasure || 'piece',
          measureValue: data.measureValue || 1,
          weight: data.weight,
          color: data.color || '',
          collection: data.collection || '',
          hsCode: data.hsCode || '',
          externalReference: data.externalReference || '',
          isActive: true,
          photos: [],
        })

        toast.success(`"${created.name}" created successfully`, {
          action: {
            label: 'Add BOM',
            onClick: () => navigate(`/v2/catalog/products/${created.id}/bom`),
          },
        })
        navigate('/v2/catalog')
      } catch (error) {
        console.error('Failed to create product:', error)
        toast.error('Unable to create product. Please try again.')
      }
    },
    [navigate]
  )

  const isSubmitting = form.formState.isSubmitting

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
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigate('/v2')}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Create Product</h1>
              <p className="text-xs text-muted-foreground">Single page flow</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Required Fields - Always Visible */}
            <div className="surface-panel rounded-3xl p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <Package className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold">Required Information</p>
                  <p className="text-sm text-muted-foreground">Fill these to create</p>
                </div>
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Classic Cotton T-Shirt" autoFocus {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="upc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>EAN / UPC Barcode</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 5901234123457" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="categoryType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Category</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                            form.setValue('subCategory', '')
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORY_TYPES.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Sub-Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!categoryType}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select sub-category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subCategories.map((sub) => (
                              <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Optional Sections - Collapsible */}
            <div className="space-y-3">
              <Section title="Description & Details" icon={FileText}>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="Internal SKU reference" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Product description..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Section>

              <Section title="Measurements" icon={Layers}>
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="unitOfMeasure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit of Measure</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {UNITS.map((unit) => (
                              <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="measureValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Measure Value</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step={0.01} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step={0.01} placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Section>

              <Section title="Attributes" icon={Tag}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Navy Blue" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="collection"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Collection</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Spring 2025" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hsCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HS Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Harmonized System code" {...field} />
                        </FormControl>
                        <FormDescription>For customs classification</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="externalReference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>External Reference</FormLabel>
                        <FormControl>
                          <Input placeholder="External system ID" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Section>

              <Section title="Photos" icon={Image}>
                <div className="rounded-xl border-2 border-dashed border-border/60 bg-secondary/30 p-8 text-center">
                  <Image className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Drag and drop images here, or click to browse
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PNG, JPG up to 10MB each
                  </p>
                </div>
              </Section>
            </div>
          </form>
        </Form>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/65 bg-background/82 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-3xl items-center justify-between px-4 sm:px-6">
          <p className="text-sm text-muted-foreground">
            Only required fields needed to create
          </p>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/v2')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="accent"
              onClick={form.handleSubmit(handleSubmit)}
              disabled={isSubmitting}
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
        </div>
      </footer>
    </div>
  )
}
