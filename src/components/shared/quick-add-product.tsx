import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Package, ArrowRight, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
} from '@/components/ui/form'
import { createCachedProduct } from '@/infrastructure/cache/catalog-cache'
import { PostCreationPrompt } from './post-creation-prompt'

const quickProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  upc: z.string().min(1, 'EAN/UPC barcode is required'),
  categoryType: z.string().min(1, 'Category is required'),
  subCategory: z.string().min(1, 'Sub-category is required'),
})

type QuickProductFormData = z.infer<typeof quickProductSchema>

const CATEGORY_TYPES = ['Apparel', 'Footwear', 'Accessories', 'Custom']
const SUB_CATEGORIES: Record<string, string[]> = {
  Apparel: ['T-Shirts', 'Pants', 'Jackets', 'Dresses', 'Sweaters'],
  Footwear: ['Sneakers', 'Boots', 'Sandals', 'Formal'],
  Accessories: ['Bags', 'Belts', 'Hats', 'Jewelry'],
  Custom: ['Custom Category'],
}

interface CreatedProduct {
  id: string
  name: string
}

interface QuickAddProductProps {
  onSuccess: (productId: string, continueToDetails: boolean) => void
  onCancel: () => void
}

export function QuickAddProduct({ onCancel }: QuickAddProductProps) {
  const navigate = useNavigate()
  const [createdProduct, setCreatedProduct] = useState<CreatedProduct | null>(null)

  const form = useForm<QuickProductFormData>({
    resolver: zodResolver(quickProductSchema),
    defaultValues: {
      name: '',
      upc: '',
      categoryType: '',
      subCategory: '',
    },
  })

  const categoryType = form.watch('categoryType')

  const subCategories = useMemo(() => {
    return SUB_CATEGORIES[categoryType] || []
  }, [categoryType])

  const handleSubmit = useCallback(
    async (data: QuickProductFormData) => {
      try {
        const created = createCachedProduct({
          ...data,
          sku: '',
          description: '',
          unitOfMeasure: 'piece',
          measureValue: 1,
          weight: undefined,
          color: '',
          collection: '',
          hsCode: '',
          externalReference: '',
          isActive: true,
          photos: [],
        })

        toast.success(`"${created.name}" created successfully`)
        setCreatedProduct({ id: created.id, name: created.name })
      } catch (error) {
        console.error('Failed to create product:', error)
        toast.error('Unable to create product. Please try again.')
      }
    },
    []
  )

  // Show post-creation prompt after product is created
  if (createdProduct) {
    return (
      <PostCreationPrompt
        entityType="product"
        entityName={createdProduct.name}
        entityId={createdProduct.id}
        onAddBom={() => navigate(`/catalog/products/${createdProduct.id}/bom`)}
        onViewDetails={() => navigate(`/catalog/products/${createdProduct.id}`)}
        onGoToCatalog={() => navigate('/catalog')}
      />
    )
  }

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

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="animate-fade-up surface-panel rounded-3xl p-6 sm:p-8 lg:p-10">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
              <Sparkles className="h-7 w-7 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl">Quick Add Product</h1>
              <p className="mt-1 text-muted-foreground">
                Create a product with just the essentials
              </p>
            </div>
          </div>

          <Form {...form}>
            <form className="mt-8 space-y-6">
              <div className="surface-subtle rounded-2xl p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10">
                    <Package className="h-4 w-4 text-accent" />
                  </div>
                  <p className="font-medium">Product Essentials</p>
                </div>

                <div className="space-y-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Product Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Classic Cotton T-Shirt"
                            autoFocus
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
              </div>

              <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Tip:</span> You
                  can add more details like photos, measurements, and BOM
                  components after creating the product.
                </p>
              </div>
            </form>
          </Form>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/65 bg-background/82 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-end gap-3 px-4 sm:px-6 lg:px-8">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
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
      </footer>
    </div>
  )
}
