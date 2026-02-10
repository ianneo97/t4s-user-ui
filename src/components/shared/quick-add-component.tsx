import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Layers, ArrowRight, Sparkles, DollarSign } from 'lucide-react'

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
  FormDescription,
  FormMessage,
} from '@/components/ui/form'
import { createCachedMaterial } from '@/infrastructure/cache/catalog-cache'
import { PostCreationPrompt } from './post-creation-prompt'

const quickComponentSchema = z.object({
  name: z.string().min(1, 'Component name is required'),
  description: z.string().optional(),
  unitOfMeasurement: z.string().min(1, 'Unit is required'),
  unitCost: z.coerce.number().min(0, 'Cost must be positive'),
  unitCostCurrency: z.string().min(1, 'Currency is required'),
})

type QuickComponentFormData = z.infer<typeof quickComponentSchema>

const UNITS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'm', label: 'Meter (m)' },
  { value: 'cm', label: 'Centimeter (cm)' },
  { value: 'pcs', label: 'Pieces' },
  { value: 'sqm', label: 'Square Meter (m²)' },
]

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CNY', label: 'CNY (¥)' },
]

interface CreatedComponent {
  id: string
  name: string
}

interface QuickAddComponentProps {
  onSuccess: (componentId: string, continueToDetails: boolean) => void
  onCancel: () => void
}

export function QuickAddComponent({
  onCancel,
}: QuickAddComponentProps) {
  const navigate = useNavigate()
  const [createdComponent, setCreatedComponent] = useState<CreatedComponent | null>(null)

  const form = useForm<QuickComponentFormData>({
    resolver: zodResolver(quickComponentSchema),
    defaultValues: {
      name: '',
      description: '',
      unitOfMeasurement: '',
      unitCost: 0,
      unitCostCurrency: 'USD',
    },
  })

  const handleSubmit = useCallback(
    async (data: QuickComponentFormData) => {
      try {
        const created = createCachedMaterial({
          ...data,
          weight: 0,
          length: undefined,
          width: undefined,
          height: undefined,
          photos: [],
          certificates: [],
          substances: [],
        })

        toast.success(`"${created.name}" created successfully`)
        setCreatedComponent({ id: created.id, name: created.name })
      } catch (error) {
        console.error('Failed to create component:', error)
        toast.error('Unable to create component. Please try again.')
      }
    },
    []
  )

  // Show post-creation prompt after component is created
  if (createdComponent) {
    return (
      <PostCreationPrompt
        entityType="component"
        entityName={createdComponent.name}
        entityId={createdComponent.id}
        onViewDetails={() => navigate(`/catalog/components/${createdComponent.id}`)}
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
              <h1 className="text-2xl sm:text-3xl">Quick Add Component</h1>
              <p className="mt-1 text-muted-foreground">
                Create a component with just the essentials
              </p>
            </div>
          </div>

          <Form {...form}>
            <form className="mt-8 space-y-6">
              <div className="surface-subtle rounded-2xl p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10">
                    <Layers className="h-4 w-4 text-accent" />
                  </div>
                  <p className="font-medium">Component Identity</p>
                </div>

                <div className="space-y-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Component Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Organic Cotton Fabric"
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief description (optional)"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="surface-subtle rounded-2xl p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10">
                    <DollarSign className="h-4 w-4 text-accent" />
                  </div>
                  <p className="font-medium">Cost & Measurement</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="unitOfMeasurement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Unit</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {UNITS.map((unit) => (
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
                    name="unitCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Cost per Unit</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unitCostCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Currency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CURRENCIES.map((curr) => (
                              <SelectItem key={curr.value} value={curr.value}>
                                {curr.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormDescription className="mt-3">
                  This determines how the component is measured and priced in
                  BOM calculations.
                </FormDescription>
              </div>

              <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Tip:</span> You
                  can add substances, certificates, and photos after creating
                  the component.
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
                Create Component
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  )
}
