import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Layers,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  DollarSign,
  FlaskConical,
  FileText,
  Trash2,
  Plus,
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
import { createCachedMaterial } from '@/infrastructure/cache/catalog-cache'
import { cn } from '@/lib/utils'

const substanceSchema = z.object({
  name: z.string().min(1, 'Substance name is required'),
  casNumber: z.string().optional(),
  percentage: z.coerce.number().min(0).max(100).optional(),
})

const componentSchema = z.object({
  name: z.string().min(1, 'Component name is required'),
  description: z.string().optional(),
  unitOfMeasurement: z.string().min(1, 'Unit is required'),
  unitCost: z.coerce.number().min(0, 'Cost must be positive'),
  unitCostCurrency: z.string().min(1, 'Currency is required'),
  weight: z.coerce.number().optional(),
  length: z.coerce.number().optional(),
  width: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
})

type ComponentFormData = z.infer<typeof componentSchema>
type SubstanceData = z.infer<typeof substanceSchema>

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

interface SectionProps {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  defaultOpen?: boolean
  badge?: string
}

function Section({ title, icon: Icon, children, defaultOpen = false, badge }: SectionProps) {
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
            {badge && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                {badge}
              </span>
            )}
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

export function CreateComponentV2Page() {
  const navigate = useNavigate()
  const [substances, setSubstances] = useState<SubstanceData[]>([])

  const form = useForm<ComponentFormData>({
    resolver: zodResolver(componentSchema),
    defaultValues: {
      name: '',
      description: '',
      unitOfMeasurement: '',
      unitCost: 0,
      unitCostCurrency: 'USD',
      weight: undefined,
      length: undefined,
      width: undefined,
      height: undefined,
    },
  })

  const addSubstance = () => {
    setSubstances([...substances, { name: '', casNumber: '', percentage: undefined }])
  }

  const updateSubstance = (index: number, field: keyof SubstanceData, value: string | number) => {
    const updated = [...substances]
    updated[index] = { ...updated[index], [field]: value }
    setSubstances(updated)
  }

  const removeSubstance = (index: number) => {
    setSubstances(substances.filter((_, i) => i !== index))
  }

  const handleSubmit = useCallback(
    async (data: ComponentFormData) => {
      try {
        const created = createCachedMaterial({
          name: data.name,
          description: data.description || '',
          unitOfMeasurement: data.unitOfMeasurement,
          unitCost: data.unitCost,
          unitCostCurrency: data.unitCostCurrency,
          weight: data.weight || 0,
          length: data.length,
          width: data.width,
          height: data.height,
          photos: [],
          certificates: [],
          substances: substances.filter(s => s.name.trim()).map(s => ({
            id: crypto.randomUUID(),
            inputType: 'manual' as const,
            substanceName: s.name,
            substanceCode: s.casNumber || '',
            percentage: s.percentage || 0,
            projectedWeight: 0,
            subCompositions: [],
            supplierId: '',
            supplierName: '',
            documents: [],
          })),
        })

        toast.success(`"${created.name}" created successfully`)
        navigate('/v2/catalog')
      } catch (error) {
        console.error('Failed to create component:', error)
        toast.error('Unable to create component. Please try again.')
      }
    },
    [navigate, substances]
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
              <h1 className="text-lg font-semibold">Create Component</h1>
              <p className="text-xs text-muted-foreground">Single page flow</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Required Fields */}
            <div className="surface-panel rounded-3xl p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <Layers className="h-5 w-5 text-accent" />
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
                      <FormLabel required>Component Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Organic Cotton Fabric" autoFocus {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="unitOfMeasurement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Unit</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {UNITS.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
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
                          <Input type="number" min={0} step={0.01} placeholder="0.00" {...field} />
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CURRENCIES.map((curr) => (
                              <SelectItem key={curr.value} value={curr.value}>{curr.label}</SelectItem>
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

            {/* Optional Sections */}
            <div className="space-y-3">
              <Section title="Description" icon={FileText}>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Component description..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Section>

              <Section title="Dimensions" icon={DollarSign}>
                <div className="grid gap-4 sm:grid-cols-4">
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
                  <FormField
                    control={form.control}
                    name="length"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Length (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step={0.01} placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="width"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Width (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step={0.01} placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Height (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step={0.01} placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Section>

              <Section
                title="Substances"
                icon={FlaskConical}
                badge={substances.length > 0 ? `${substances.length}` : undefined}
              >
                <div className="space-y-4">
                  <FormDescription>
                    Add chemical substances and their composition percentages for compliance tracking.
                  </FormDescription>

                  {substances.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-border/60 bg-secondary/30 p-6 text-center">
                      <FlaskConical className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        No substances added yet
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addSubstance}
                        className="mt-3 gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Substance
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {substances.map((substance, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/50 p-4"
                        >
                          <div className="grid flex-1 gap-3 sm:grid-cols-3">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Substance Name *
                              </label>
                              <Input
                                value={substance.name}
                                onChange={(e) => updateSubstance(index, 'name', e.target.value)}
                                placeholder="e.g., Cotton"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                CAS Number
                              </label>
                              <Input
                                value={substance.casNumber || ''}
                                onChange={(e) => updateSubstance(index, 'casNumber', e.target.value)}
                                placeholder="e.g., 9004-34-6"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Percentage (%)
                              </label>
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                step={0.1}
                                value={substance.percentage || ''}
                                onChange={(e) => updateSubstance(index, 'percentage', Number(e.target.value))}
                                placeholder="0.0"
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSubstance(index)}
                            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addSubstance}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Another
                      </Button>
                    </div>
                  )}
                </div>
              </Section>
            </div>
          </form>
        </Form>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/65 bg-background/82 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-3xl items-center justify-between px-4 sm:px-6">
          <p className="text-sm text-muted-foreground">
            {substances.length > 0 ? `${substances.length} substance(s) added` : 'Only required fields needed'}
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
                  Create Component
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
