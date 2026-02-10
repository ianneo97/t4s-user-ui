import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useFormContext } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Package, Tag, Ruler, Image, Info } from 'lucide-react'

import { CreationFlow } from '@/components/shared/creation-flow'
import type { CreationStep } from '@/components/shared/creation-flow'
import { ImageUploader } from '@/components/shared/image-uploader'
import type { ImageFile } from '@/components/shared/image-uploader'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'
import {
  PRODUCT_CREATION_DRAFT_KEY,
  clearCachedDraft,
  createCachedProduct,
  getCachedDraft,
  setCachedDraft,
} from '@/infrastructure/cache/catalog-cache'

// Schema
const productSchema = z.object({
  // Identity
  name: z.string().min(1, 'Product name is required'),
  upc: z.string().min(1, 'EAN/UPC barcode is required'),
  sku: z.string().optional(),
  description: z.string().optional(),

  // Classification
  categoryType: z.string().min(1, 'Category type is required'),
  subCategory: z.string().min(1, 'Sub-category is required'),

  // Measurement
  unitOfMeasure: z.string().min(1, 'Unit of measure is required'),
  measureValue: z.coerce.number().min(0, 'Must be a positive number'),
  weight: z.coerce.number().optional(),

  // Optional details
  color: z.string().optional(),
  collection: z.string().optional(),
  hsCode: z.string().optional(),
  externalReference: z.string().optional(),

  // Status
  isActive: z.boolean().default(true),

  // Media
  photos: z
    .array(
      z.object({
        id: z.string(),
        url: z.string(),
        file: z.any().optional(),
        name: z.string().optional(),
        size: z.number().optional(),
        contentType: z.string().optional(),
      })
    )
    .default([]),
})

type ProductFormData = z.infer<typeof productSchema>

const PRODUCT_DEFAULT_VALUES: ProductFormData = {
  name: '',
  upc: '',
  sku: '',
  description: '',
  categoryType: '',
  subCategory: '',
  unitOfMeasure: '',
  measureValue: 1,
  weight: undefined,
  color: '',
  collection: '',
  hsCode: '',
  externalReference: '',
  isActive: true,
  photos: [],
}

// Mock data - replace with actual API data
const CATEGORY_TYPES = ['Apparel', 'Footwear', 'Accessories', 'Custom']
const SUB_CATEGORIES: Record<string, string[]> = {
  Apparel: ['T-Shirts', 'Pants', 'Jackets', 'Dresses', 'Sweaters'],
  Footwear: ['Sneakers', 'Boots', 'Sandals', 'Formal'],
  Accessories: ['Bags', 'Belts', 'Hats', 'Jewelry'],
  Custom: ['Custom Category'],
}
const UNITS_OF_MEASURE = [
  { value: 'piece', label: 'Piece' },
  { value: 'pair', label: 'Pair' },
  { value: 'set', label: 'Set' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'kg', label: 'Kilogram' },
  { value: 'meter', label: 'Meter' },
]

// Step Components
function ProductIdentityStep() {
  const form = useFormContext<ProductFormData>()

  return (
    <div className="space-y-8">
      {/* Main identity card */}
      <div className="surface-subtle rounded-3xl p-6 lg:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <Package className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="font-medium">Product Identity</h3>
            <p className="text-sm text-muted-foreground">
              Basic information about your product
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="lg:col-span-2">
                <FormLabel required>Product Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Classic Cotton T-Shirt"
                    {...field}
                  />
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
                <FormDescription>
                  The unique product identifier barcode
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., TS-BLK-M-001" {...field} />
                </FormControl>
                <FormDescription>Your internal stock keeping unit</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="lg:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe your product..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Status toggle */}
      <div className="surface-subtle flex items-center justify-between rounded-3xl p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <Info className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-medium">Product Status</p>
            <p className="text-sm text-muted-foreground">
              Active products are visible and can be ordered
            </p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}

function ProductClassificationStep() {
  const form = useFormContext<ProductFormData>()
  const categoryType = form.watch('categoryType')

  const subCategories = useMemo(() => {
    return SUB_CATEGORIES[categoryType] || []
  }, [categoryType])

  return (
    <div className="space-y-8">
      {/* Classification card */}
      <div className="surface-subtle rounded-3xl p-6 lg:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <Tag className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="font-medium">Classification</h3>
            <p className="text-sm text-muted-foreground">
              Categorize your product for better organization
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="categoryType"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Category Type</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value)
                    form.setValue('subCategory', '')
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORY_TYPES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
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
                      <SelectItem key={sub} value={sub}>
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Measurement card */}
      <div className="surface-subtle rounded-3xl p-6 lg:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <Ruler className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="font-medium">Measurement</h3>
            <p className="text-sm text-muted-foreground">
              Define how this product is measured and sold
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="unitOfMeasure"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Unit of Measure</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {UNITS_OF_MEASURE.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
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
                <FormLabel required>Measure Value</FormLabel>
                <FormControl>
                  <Input type="number" min={0} placeholder="1" {...field} />
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
                <FormLabel>Weight (g)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} placeholder="250" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  )
}

function ProductDetailsStep() {
  const form = useFormContext<ProductFormData>()

  return (
    <div className="surface-subtle rounded-3xl p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
          <Info className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h3 className="font-medium">Additional Details</h3>
          <p className="text-sm text-muted-foreground">
            Optional information to enrich your product data
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color / Variant</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Midnight Black" {...field} />
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
                <Input placeholder="e.g., Spring 2024" {...field} />
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
                <Input placeholder="e.g., 6109.10.00" {...field} />
              </FormControl>
              <FormDescription>Harmonized System code for customs</FormDescription>
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
              <FormDescription>Reference code from other systems</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}

function ProductPhotosStep() {
  const form = useFormContext<ProductFormData>()
  const photos = form.watch('photos')

  const handlePhotosChange = useCallback(
    (newPhotos: ImageFile[]) => {
      form.setValue('photos', newPhotos)
    },
    [form]
  )

  return (
    <div className="surface-subtle rounded-3xl p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
          <Image className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h3 className="font-medium">Product Photos</h3>
          <p className="text-sm text-muted-foreground">
            Add images to showcase your product. Drag to reorder.
          </p>
        </div>
      </div>

      <ImageUploader
        images={photos}
        onChange={handlePhotosChange}
        maxImages={8}
      />
    </div>
  )
}

// Main component
export function CreateProductPage() {
  const navigate = useNavigate()
  const [hasDraft, setHasDraft] = useState(false)

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: PRODUCT_DEFAULT_VALUES,
    mode: 'onChange',
  })
  const watchedValues = form.watch()

  useEffect(() => {
    const draft = getCachedDraft<Partial<ProductFormData>>(
      PRODUCT_CREATION_DRAFT_KEY
    )
    if (!draft) return

    form.reset({
      ...PRODUCT_DEFAULT_VALUES,
      ...draft,
    })
    setHasDraft(true)
  }, [form])

  useEffect(() => {
    if (!form.formState.isDirty) return

    const timeoutId = window.setTimeout(() => {
      setCachedDraft(PRODUCT_CREATION_DRAFT_KEY, watchedValues)
      setHasDraft(true)
    }, 350)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [watchedValues, form.formState.isDirty])

  const steps: CreationStep[] = useMemo(
    () => [
      {
        id: 'identity',
        title: 'Product Identity',
        description: 'Start with the basics - name, barcode, and description',
        content: <ProductIdentityStep />,
        validate: async () => {
          const result = await form.trigger(['name', 'upc'])
          return result
        },
      },
      {
        id: 'classification',
        title: 'Classification & Measurement',
        description: 'Categorize your product and define measurement units',
        content: <ProductClassificationStep />,
        validate: async () => {
          const result = await form.trigger([
            'categoryType',
            'subCategory',
            'unitOfMeasure',
            'measureValue',
          ])
          return result
        },
      },
      {
        id: 'details',
        title: 'Additional Details',
        description: 'Optional details to enrich your product information',
        content: <ProductDetailsStep />,
      },
      {
        id: 'photos',
        title: 'Product Photos',
        description: 'Upload images to showcase your product',
        content: <ProductPhotosStep />,
      },
    ],
    [form]
  )

  const completedCoreFields = useMemo(() => {
    const requiredFields = [
      watchedValues.name,
      watchedValues.upc,
      watchedValues.categoryType,
      watchedValues.subCategory,
      watchedValues.unitOfMeasure,
    ]

    return requiredFields.filter((value) => String(value || '').trim()).length
  }, [
    watchedValues.categoryType,
    watchedValues.name,
    watchedValues.subCategory,
    watchedValues.unitOfMeasure,
    watchedValues.upc,
  ])

  const completionPercentage = Math.round((completedCoreFields / 5) * 100)

  const sidebarPanel = useMemo(() => {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Live Snapshot
          </p>
          <Badge variant="secondary" className="font-semibold">
            {completionPercentage}%
          </Badge>
        </div>

        <div>
          <Progress value={completionPercentage} className="h-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            Complete core identity and classification fields.
          </p>
        </div>

        <dl className="space-y-2 text-sm">
          <div className="rounded-xl bg-card/70 px-3 py-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Product
            </dt>
            <dd className="mt-1 font-semibold">
              {watchedValues.name || 'Unnamed product'}
            </dd>
          </div>
          <div className="rounded-xl bg-card/70 px-3 py-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Barcode
            </dt>
            <dd className="mt-1 font-semibold text-foreground/90">
              {watchedValues.upc || 'Not set'}
            </dd>
          </div>
          <div className="rounded-xl bg-card/70 px-3 py-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Category
            </dt>
            <dd className="mt-1 font-semibold text-foreground/90">
              {watchedValues.categoryType
                ? `${watchedValues.categoryType} / ${
                    watchedValues.subCategory || 'Sub-category pending'
                  }`
                : 'Not set'}
            </dd>
          </div>
          <div className="rounded-xl bg-card/70 px-3 py-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Media
            </dt>
            <dd className="mt-1 font-semibold text-foreground/90">
              {watchedValues.photos?.length || 0} photo
              {(watchedValues.photos?.length || 0) === 1 ? '' : 's'}
            </dd>
          </div>
        </dl>
      </div>
    )
  }, [
    completionPercentage,
    watchedValues.categoryType,
    watchedValues.name,
    watchedValues.photos?.length,
    watchedValues.subCategory,
    watchedValues.upc,
  ])

  const handleSaveDraft = useCallback(() => {
    setCachedDraft(PRODUCT_CREATION_DRAFT_KEY, form.getValues())
    setHasDraft(true)
    toast.success('Product draft saved locally')
  }, [form])

  const handleDiscardDraft = useCallback(() => {
    clearCachedDraft(PRODUCT_CREATION_DRAFT_KEY)
    setHasDraft(false)
    toast.success('Saved product draft cleared')
  }, [])

  const handleSubmit = useCallback(
    async (data: ProductFormData) => {
      try {
        const created = createCachedProduct({
          ...data,
          photos: data.photos.map((photo) => ({
            id: photo.id,
            url: photo.url,
            name: photo.name,
            size: photo.size,
            contentType: photo.contentType,
          })),
        })

        clearCachedDraft(PRODUCT_CREATION_DRAFT_KEY)
        setHasDraft(false)
        toast.success(`"${created.name}" saved to local cache`)
        navigate('/products')
      } catch (error) {
        console.error('Failed to create product:', error)
        toast.error('Unable to save product. Please try again.')
      }
    },
    [navigate]
  )

  return (
    <CreationFlow
      title="Create Product"
      subtitle="Add a new product to your catalog"
      steps={steps}
      form={form}
      onSubmit={handleSubmit}
      submitLabel="Create Product"
      backPath="/products"
      sidebarPanel={sidebarPanel}
      hasDraft={hasDraft}
      onSaveDraft={handleSaveDraft}
      onDiscardDraft={handleDiscardDraft}
    />
  )
}
