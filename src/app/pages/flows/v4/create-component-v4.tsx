import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Check,
  Sparkles,
  FlaskConical,
  Plus,
  Trash2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { createCachedMaterial } from '@/infrastructure/cache/catalog-cache'
import { cn } from '@/lib/utils'

const componentSchema = z.object({
  name: z.string().min(1, 'Component name is required'),
  unitOfMeasurement: z.string().min(1, 'Unit is required'),
  unitCost: z.coerce.number().min(0, 'Cost must be positive'),
  unitCostCurrency: z.string().min(1, 'Currency is required'),
  description: z.string().optional(),
})

type ComponentFormData = z.infer<typeof componentSchema>

interface SubstanceData {
  name: string
  casNumber?: string
  percentage?: number
}

interface Template {
  id: string
  name: string
  icon: string
  description: string
  defaults: Partial<ComponentFormData>
  commonSubstances?: SubstanceData[]
}

const TEMPLATES: Template[] = [
  {
    id: 'cotton-fabric',
    name: 'Cotton Fabric',
    icon: '🧵',
    description: 'Natural cotton textile material',
    defaults: {
      unitOfMeasurement: 'sqm',
      unitCostCurrency: 'USD',
    },
    commonSubstances: [
      { name: 'Cotton', casNumber: '9004-34-6', percentage: 95 },
      { name: 'Elastane', casNumber: '25038-36-2', percentage: 5 },
    ],
  },
  {
    id: 'polyester-fabric',
    name: 'Polyester Fabric',
    icon: '🪡',
    description: 'Synthetic polyester textile',
    defaults: {
      unitOfMeasurement: 'sqm',
      unitCostCurrency: 'USD',
    },
    commonSubstances: [
      { name: 'Polyester', casNumber: '25038-59-9', percentage: 100 },
    ],
  },
  {
    id: 'leather',
    name: 'Leather',
    icon: '🥾',
    description: 'Natural or synthetic leather',
    defaults: {
      unitOfMeasurement: 'sqm',
      unitCostCurrency: 'EUR',
    },
    commonSubstances: [
      { name: 'Collagen', casNumber: '9007-34-5', percentage: 85 },
      { name: 'Tanning agents', percentage: 15 },
    ],
  },
  {
    id: 'metal-hardware',
    name: 'Metal Hardware',
    icon: '🔩',
    description: 'Buttons, zippers, buckles',
    defaults: {
      unitOfMeasurement: 'pcs',
      unitCostCurrency: 'USD',
    },
    commonSubstances: [
      { name: 'Zinc alloy', casNumber: '7440-66-6', percentage: 70 },
      { name: 'Nickel', casNumber: '7440-02-0', percentage: 30 },
    ],
  },
  {
    id: 'rubber',
    name: 'Rubber Sole',
    icon: '👟',
    description: 'Rubber material for footwear',
    defaults: {
      unitOfMeasurement: 'kg',
      unitCostCurrency: 'USD',
    },
    commonSubstances: [
      { name: 'Natural rubber', casNumber: '9006-04-6', percentage: 60 },
      { name: 'Synthetic rubber', casNumber: '9003-55-8', percentage: 40 },
    ],
  },
  {
    id: 'thread',
    name: 'Thread / Yarn',
    icon: '🧶',
    description: 'Sewing thread or yarn',
    defaults: {
      unitOfMeasurement: 'm',
      unitCostCurrency: 'USD',
    },
    commonSubstances: [
      { name: 'Polyester', casNumber: '25038-59-9', percentage: 100 },
    ],
  },
  {
    id: 'dye',
    name: 'Dye / Colorant',
    icon: '🎨',
    description: 'Textile dyes and colorants',
    defaults: {
      unitOfMeasurement: 'kg',
      unitCostCurrency: 'USD',
    },
  },
  {
    id: 'custom',
    name: 'Custom Component',
    icon: '✨',
    description: 'Start from scratch',
    defaults: {
      unitOfMeasurement: 'pcs',
      unitCostCurrency: 'USD',
    },
  },
]

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

export function CreateComponentV4Page() {
  const navigate = useNavigate()
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [substances, setSubstances] = useState<SubstanceData[]>([])

  const form = useForm<ComponentFormData>({
    resolver: zodResolver(componentSchema),
    defaultValues: {
      name: '',
      unitOfMeasurement: 'pcs',
      unitCost: 0,
      unitCostCurrency: 'USD',
      description: '',
    },
  })

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template)

    // Apply template defaults
    form.reset({
      name: '',
      unitOfMeasurement: template.defaults.unitOfMeasurement || 'pcs',
      unitCost: 0,
      unitCostCurrency: template.defaults.unitCostCurrency || 'USD',
      description: '',
    })

    // Apply template substances if available
    if (template.commonSubstances) {
      setSubstances([...template.commonSubstances])
    } else {
      setSubstances([])
    }
  }

  const handleBack = () => {
    if (selectedTemplate) {
      setSelectedTemplate(null)
      setSubstances([])
      form.reset()
    } else {
      navigate('/v4')
    }
  }

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
          weight: 0,
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
        navigate('/v4/catalog')
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
              onClick={handleBack}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Create Component</h1>
              <p className="text-xs text-muted-foreground">
                {selectedTemplate ? `Template: ${selectedTemplate.name}` : 'Template flow'}
              </p>
            </div>
          </div>
          {selectedTemplate && (
            <Badge variant="secondary" className="gap-1.5">
              <span>{selectedTemplate.icon}</span>
              {selectedTemplate.name}
            </Badge>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {!selectedTemplate ? (
          /* Template Selection */
          <div className="animate-fade-up">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
                <Sparkles className="h-7 w-7 text-accent" />
              </div>
              <h2 className="text-2xl font-semibold">Choose a Template</h2>
              <p className="mt-2 text-muted-foreground">
                Start with a pre-configured template or create a custom component
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateSelect(template)}
                  className={cn(
                    'group flex items-start gap-4 rounded-2xl border border-border/70 bg-card/60 p-5 text-left transition-all',
                    'hover:border-accent/50 hover:bg-card hover:shadow-[0_8px_24px_-8px_hsl(var(--accent)/0.2)]',
                    template.id === 'custom' && 'border-dashed'
                  )}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-2xl">
                    {template.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold group-hover:text-accent">
                      {template.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {template.description}
                    </p>
                    {template.commonSubstances && (
                      <p className="mt-2 text-xs text-accent">
                        {template.commonSubstances.length} pre-filled substances
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Component Form */
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="animate-fade-up space-y-6">
              {/* Basic Info */}
              <div className="surface-panel rounded-3xl p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-xl">
                    {selectedTemplate.icon}
                  </div>
                  <div>
                    <p className="font-semibold">Component Details</p>
                    <p className="text-sm text-muted-foreground">
                      Customize from {selectedTemplate.name} template
                    </p>
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
                          <Input
                            placeholder={`e.g., Premium ${selectedTemplate.name}`}
                            autoFocus
                            {...field}
                          />
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
                          <Select onValueChange={field.onChange} value={field.value}>
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
                </div>
              </div>

              {/* Substances Section */}
              <div className="surface-panel rounded-3xl p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                      <FlaskConical className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold">Substances</p>
                      <p className="text-sm text-muted-foreground">
                        Chemical composition for compliance
                      </p>
                    </div>
                  </div>
                  {substances.length > 0 && (
                    <Badge variant="secondary">{substances.length} added</Badge>
                  )}
                </div>

                <FormDescription className="mb-4">
                  {selectedTemplate.commonSubstances
                    ? 'Pre-filled from template. Modify as needed.'
                    : 'Add chemical substances for compliance tracking.'}
                </FormDescription>

                {substances.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-border/60 bg-secondary/30 p-6 text-center">
                    <FlaskConical className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      No substances added
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
            </form>
          </Form>
        )}
      </main>

      {selectedTemplate && (
        <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/65 bg-background/82 backdrop-blur-xl">
          <div className="mx-auto flex h-20 max-w-3xl items-center justify-between px-4 sm:px-6">
            <p className="text-sm text-muted-foreground">
              {substances.length > 0
                ? `${substances.length} substance(s) configured`
                : 'Ready to create'}
            </p>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Back
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
                    <Check className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
