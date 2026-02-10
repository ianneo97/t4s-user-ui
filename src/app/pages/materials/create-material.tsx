import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, useFormContext, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Layers,
  Ruler,
  Image,
  FileCheck,
  FlaskConical,
  DollarSign,
  Plus,
  Trash2,
  Calendar,
} from 'lucide-react'

import { CreationFlow } from '@/components/shared/creation-flow'
import type { CreationStep } from '@/components/shared/creation-flow'
import { CreationModePicker } from '@/components/shared/creation-mode-picker'
import type { CreationMode } from '@/components/shared/creation-mode-picker'
import { QuickAddComponent } from '@/components/shared/quick-add-component'
import { ImageUploader } from '@/components/shared/image-uploader'
import type { ImageFile } from '@/components/shared/image-uploader'
import { FileUploader } from '@/components/shared/file-uploader'
import type { UploadedFile } from '@/components/shared/file-uploader'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  MATERIAL_CREATION_DRAFT_KEY,
  clearCachedDraft,
  createCachedMaterial,
  getCachedDraft,
  setCachedDraft,
} from '@/infrastructure/cache/catalog-cache'
import type {
  CachedMaterialSubstanceInputType,
  CachedMaterialSubstanceSourceType,
} from '@/infrastructure/cache/catalog-cache'
import { cn } from '@/lib/utils'

// Schema
const certificateSchema = z.object({
  id: z.string(),
  type: z.string().min(1, 'Certificate type is required'),
  number: z.string().min(1, 'Certificate number is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  weight: z.coerce.number().optional(),
  files: z.array(z.any()).default([]),
})

const substanceInputTypeOptions = ['chemical', 'manual'] as const
const substanceSourceTypeOptions = ['natural', 'eu', 'other', 'no'] as const

const subCompositionSchema = z.object({
  id: z.string(),
  inputType: z.enum(substanceInputTypeOptions, {
    required_error: 'Subcomposition type is required',
  }),
  substanceName: z.string().min(1, 'Subcomposition name is required'),
  substanceCode: z.string().min(1, 'Subcomposition CAS number is required'),
  percentage: z.coerce
    .number()
    .min(0.000001, 'Subcomposition percentage must be greater than 0')
    .max(100, 'Subcomposition percentage cannot exceed 100'),
  projectedWeight: z.coerce
    .number()
    .min(0, 'Subcomposition projected weight must be positive'),
})

const substanceSchema = z
  .object({
    id: z.string(),
    inputType: z.enum(substanceInputTypeOptions, {
      required_error: 'Substance type is required',
    }),
    substanceName: z.string().min(1, 'Substance name is required'),
    substanceCode: z.string().min(1, 'CAS number is required'),
    percentage: z.coerce
      .number()
      .min(0.000001, 'Percentage must be greater than 0')
      .max(100, 'Percentage cannot exceed 100'),
    projectedWeight: z.coerce
      .number()
      .min(0, 'Projected weight must be positive'),
    subCompositions: z.array(subCompositionSchema).default([]),
    sourceType: z.enum(substanceSourceTypeOptions).optional(),
    otherSourceReason: z.string().optional(),
    reachRegistrationNumber: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.sourceType === 'other' && !value.otherSourceReason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['otherSourceReason'],
        message: 'Please describe the exemption reason',
      })
    }

    if (value.sourceType === 'no' && !value.reachRegistrationNumber?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reachRegistrationNumber'],
        message: 'REACH registration number is required when not exempt',
      })
    }

    if (value.inputType === 'manual' && value.subCompositions.length > 0) {
      const totalSubComposition = value.subCompositions.reduce(
        (sum, item) => sum + Number(item.percentage || 0),
        0
      )
      if (Math.abs(totalSubComposition - 100) > 0.000001) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['subCompositions'],
          message:
            'Manual substance child subcomposition total must equal exactly 100%',
        })
      }
    }
  })

const materialSchema = z.object({
  // Basic info
  name: z.string().min(1, 'Component name is required'),
  description: z.string().optional(),

  // Cost
  unitOfMeasurement: z.string().min(1, 'Unit of measurement is required'),
  unitCost: z.coerce.number().min(0, 'Unit cost must be positive'),
  unitCostCurrency: z.string().min(1, 'Currency is required'),

  // Physical specs
  weight: z.coerce.number().min(0, 'Weight must be positive'),
  length: z.coerce.number().optional(),
  width: z.coerce.number().optional(),
  height: z.coerce.number().optional(),

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

  // Certificates
  certificates: z.array(certificateSchema).default([]),

  // Substances
  substances: z.array(substanceSchema).default([]),
})

type MaterialFormData = z.infer<typeof materialSchema>
type CertificateData = z.infer<typeof certificateSchema>
type SubstanceData = z.infer<typeof substanceSchema>
type SubCompositionData = z.infer<typeof subCompositionSchema>

const MATERIAL_DEFAULT_VALUES: MaterialFormData = {
  name: '',
  description: '',
  unitOfMeasurement: '',
  unitCost: 0,
  unitCostCurrency: 'USD',
  weight: 0,
  length: undefined,
  width: undefined,
  height: undefined,
  photos: [],
  certificates: [],
  substances: [],
}

// Mock data
const UNITS_OF_MEASURE = [
  { value: 'piece', label: 'Piece (pc)' },
  { value: 'meter', label: 'Meter (m)' },
  { value: 'yard', label: 'Yard (yd)' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'gram', label: 'Gram (g)' },
  { value: 'roll', label: 'Roll' },
  { value: 'sheet', label: 'Sheet' },
]

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'HKD', label: 'HKD ($)' },
  { value: 'CNY', label: 'CNY (¥)' },
]

const CERTIFICATE_TYPES = [
  'OEKO-TEX Standard 100',
  'GOTS (Global Organic Textile Standard)',
  'GRS (Global Recycled Standard)',
  'REACH Compliance',
  'ISO 9001',
  'ISO 14001',
  'FSC (Forest Stewardship Council)',
  'BSCI',
  'Other',
]

const SUBSTANCE_INPUT_TYPES: {
  value: CachedMaterialSubstanceInputType
  label: string
}[] = [
  { value: 'chemical', label: 'Chemical' },
  { value: 'manual', label: 'Manual' },
]

const SUBSTANCE_SOURCE_TYPES: {
  value: CachedMaterialSubstanceSourceType
  label: string
  description: string
}[] = [
  {
    value: 'natural',
    label: 'Exempt - Natural',
    description: 'Natural material source',
  },
  {
    value: 'eu',
    label: 'Exempt - EU Source',
    description: 'Substance sourced from EU supplier',
  },
  {
    value: 'other',
    label: 'Exempt - Other',
    description: 'Custom exemption reason required',
  },
  {
    value: 'no',
    label: 'Not Exempt',
    description: 'REACH registration number required',
  },
]

function calculateProjectedWeight(weight: number, percentage: number): number {
  if (!Number.isFinite(weight) || !Number.isFinite(percentage)) return 0
  return Number(((weight * percentage) / 100).toFixed(6))
}

// Step Components
function MaterialInfoStep() {
  const form = useFormContext<MaterialFormData>()

  return (
    <div className="space-y-8">
      {/* Basic info card */}
      <div className="surface-subtle rounded-3xl p-6 lg:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <Layers className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="font-medium">Component Information</h3>
            <p className="text-sm text-muted-foreground">
              Basic details about this material or component
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Component Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Organic Cotton Fabric" {...field} />
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
                    placeholder="Describe this component..."
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

      {/* Cost card */}
      <div className="surface-subtle rounded-3xl p-6 lg:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <DollarSign className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="font-medium">Cost & Measurement</h3>
            <p className="text-sm text-muted-foreground">
              Define how this component is measured and priced
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="unitOfMeasurement"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Unit of Measurement</FormLabel>
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
            name="unitCostCurrency"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>Currency</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
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
                <FormLabel required>Unit Cost</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
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

function MaterialSpecsStep() {
  const form = useFormContext<MaterialFormData>()

  return (
    <div className="surface-subtle rounded-3xl p-6 lg:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
          <Ruler className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h3 className="font-medium">Physical Specifications</h3>
          <p className="text-sm text-muted-foreground">
            Dimensions and weight of the component
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FormField
          control={form.control}
          name="weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Weight (grams)</FormLabel>
              <FormControl>
                <Input type="number" min={0} placeholder="0" {...field} />
              </FormControl>
              <FormDescription>Weight per unit of measurement</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div /> {/* Spacer */}
        <FormField
          control={form.control}
          name="length"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Length (cm)</FormLabel>
              <FormControl>
                <Input type="number" min={0} placeholder="0" {...field} />
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
                <Input type="number" min={0} placeholder="0" {...field} />
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
                <Input type="number" min={0} placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}

function MaterialSubstancesStep() {
  const form = useFormContext<MaterialFormData>()
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'substances',
  })

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const componentWeight = Number(form.watch('weight') || 0)

  const [newSubstance, setNewSubstance] = useState<Partial<SubstanceData>>({
    inputType: 'chemical',
    substanceName: '',
    substanceCode: '',
    percentage: undefined,
    projectedWeight: 0,
    subCompositions: [],
    sourceType: undefined,
    otherSourceReason: '',
    reachRegistrationNumber: '',
  })
  const [newSubComposition, setNewSubComposition] = useState<
    Partial<SubCompositionData>
  >({
    inputType: 'chemical',
    substanceName: '',
    substanceCode: '',
    percentage: undefined,
    projectedWeight: 0,
  })

  const sourceTypeLabelByValue = useMemo(() => {
    return new Map(
      SUBSTANCE_SOURCE_TYPES.map((item) => [item.value, item.label])
    )
  }, [])

  const totalPercentage = useMemo(() => {
    return fields.reduce((sum, item) => sum + Number(item.percentage || 0), 0)
  }, [fields])
  const subCompositionPercentageTotal = useMemo(() => {
    return (newSubstance.subCompositions || []).reduce(
      (sum, item) => sum + Number(item.percentage || 0),
      0
    )
  }, [newSubstance.subCompositions])

  const resetSubCompositionDraft = useCallback(() => {
    setNewSubComposition({
      inputType: 'chemical',
      substanceName: '',
      substanceCode: '',
      percentage: undefined,
      projectedWeight: 0,
    })
  }, [])

  const resetSubstanceDraft = useCallback(() => {
    setNewSubstance({
      inputType: 'chemical',
      substanceName: '',
      substanceCode: '',
      percentage: undefined,
      projectedWeight: 0,
      subCompositions: [],
      sourceType: undefined,
      otherSourceReason: '',
      reachRegistrationNumber: '',
    })
    resetSubCompositionDraft()
  }, [resetSubCompositionDraft])

  const handlePercentageChange = useCallback(
    (rawValue: string) => {
      const percentage = rawValue === '' ? undefined : Number(rawValue)
      const projectedWeight = calculateProjectedWeight(
        componentWeight,
        Number(percentage || 0)
      )
      setNewSubstance((prev) => ({
        ...prev,
        percentage,
        projectedWeight,
        subCompositions: (prev.subCompositions || []).map((subComposition) => ({
          ...subComposition,
          projectedWeight: calculateProjectedWeight(
            projectedWeight,
            Number(subComposition.percentage || 0)
          ),
        })),
      }))
    },
    [componentWeight]
  )
  const handleSubCompositionPercentageChange = useCallback(
    (rawValue: string) => {
      const percentage = rawValue === '' ? undefined : Number(rawValue)
      const parentProjectedWeight = Number(newSubstance.projectedWeight || 0)
      setNewSubComposition((prev) => ({
        ...prev,
        percentage,
        projectedWeight: calculateProjectedWeight(
          parentProjectedWeight,
          Number(percentage || 0)
        ),
      }))
    },
    [newSubstance.projectedWeight]
  )

  const handleAddSubComposition = () => {
    const substanceName = newSubComposition.substanceName?.trim()
    const substanceCode = newSubComposition.substanceCode?.trim()
    const percentage = Number(newSubComposition.percentage || 0)
    const parentProjectedWeight = Number(newSubstance.projectedWeight || 0)

    if (!newSubComposition.inputType || !substanceName || !substanceCode) {
      toast.error('Child subcomposition type, name, and CAS number are required')
      return
    }

    if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
      toast.error('Child subcomposition percentage must be between 0 and 100')
      return
    }

    if (subCompositionPercentageTotal + percentage > 100.000001) {
      toast.error(
        `Child subcomposition total exceeds 100%. Remaining budget: ${Math.max(
          100 - subCompositionPercentageTotal,
          0
        ).toFixed(2)}%`
      )
      return
    }

    setNewSubstance((prev) => ({
      ...prev,
      subCompositions: [
        ...(prev.subCompositions || []),
        {
          id: crypto.randomUUID(),
          inputType: newSubComposition.inputType || 'chemical',
          substanceName,
          substanceCode,
          percentage,
          projectedWeight: calculateProjectedWeight(
            parentProjectedWeight,
            percentage
          ),
        },
      ],
    }))

    resetSubCompositionDraft()
  }

  const handleRemoveSubComposition = useCallback((index: number) => {
    setNewSubstance((prev) => ({
      ...prev,
      subCompositions: (prev.subCompositions || []).filter(
        (_, childIndex) => childIndex !== index
      ),
    }))
  }, [])

  const handleAddSubstance = () => {
    const substanceName = newSubstance.substanceName?.trim()
    const substanceCode = newSubstance.substanceCode?.trim()
    const percentage = Number(newSubstance.percentage || 0)
    const sourceType = newSubstance.sourceType
    const childSubCompositions = newSubstance.subCompositions || []

    if (!newSubstance.inputType || !substanceName || !substanceCode) {
      toast.error('Substance type, name, and CAS number are required')
      return
    }

    if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
      toast.error('Substance percentage must be between 0 and 100')
      return
    }

    if (totalPercentage + percentage > 100.000001) {
      toast.error(
        `Substance composition exceeds 100%. Remaining budget: ${Math.max(
          100 - totalPercentage,
          0
        ).toFixed(2)}%`
      )
      return
    }

    if (sourceType === 'other' && !newSubstance.otherSourceReason?.trim()) {
      toast.error('Please provide an exemption reason for "Exempt - Other"')
      return
    }

    if (sourceType === 'no' && !newSubstance.reachRegistrationNumber?.trim()) {
      toast.error('REACH registration number is required when not exempt')
      return
    }

    if (newSubstance.inputType === 'manual' && childSubCompositions.length > 0) {
      const childTotal = childSubCompositions.reduce(
        (sum, item) => sum + Number(item.percentage || 0),
        0
      )
      if (Math.abs(childTotal - 100) > 0.000001) {
        toast.error(
          `Manual substance child subcomposition total must equal 100% (currently ${childTotal.toFixed(
            2
          )}%)`
        )
        return
      }
    }

    append({
      id: crypto.randomUUID(),
      inputType: newSubstance.inputType,
      substanceName,
      substanceCode,
      percentage,
      projectedWeight: calculateProjectedWeight(componentWeight, percentage),
      subCompositions: childSubCompositions.map((subComposition) => ({
        id: subComposition.id || crypto.randomUUID(),
        inputType: subComposition.inputType || 'chemical',
        substanceName: String(subComposition.substanceName || '').trim(),
        substanceCode: String(subComposition.substanceCode || '').trim(),
        percentage: Number(subComposition.percentage || 0),
        projectedWeight: Number(subComposition.projectedWeight || 0),
      })),
      sourceType,
      otherSourceReason: newSubstance.otherSourceReason?.trim() || undefined,
      reachRegistrationNumber:
        newSubstance.reachRegistrationNumber?.trim() || undefined,
    })

    resetSubstanceDraft()
    setIsDialogOpen(false)
  }

  const compositionProgress = Math.min(totalPercentage, 100)

  return (
    <>
      <div className="surface-subtle rounded-3xl p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <FlaskConical className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-medium">Substance Composition</h3>
              <p className="text-sm text-muted-foreground">
                Add chemical or manual substances with CAS and ratio
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Substance
          </Button>
        </div>

        <div className="mb-6 rounded-2xl border border-border/70 bg-card/60 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-muted-foreground">
              Composition Total
            </span>
            <span className="font-semibold">{totalPercentage.toFixed(2)}%</span>
          </div>
          <Progress value={compositionProgress} className="h-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            Component weight baseline: {componentWeight.toFixed(2)} g
          </p>
        </div>

        {fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12">
            <FlaskConical className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              No substances captured yet
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              className="mt-4 gap-2"
            >
              <Plus className="h-4 w-4" />
              Add first substance
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-2xl border border-border/80 bg-card/70 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{field.substanceName}</p>
                      <Badge variant="secondary" className="uppercase">
                        {field.inputType}
                      </Badge>
                      <Badge variant="outline">CAS {field.substanceCode}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {Number(field.percentage).toFixed(2)}% •{' '}
                      {Number(field.projectedWeight).toFixed(3)} g projected
                    </p>
                    {field.sourceType ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Source:{' '}
                        {sourceTypeLabelByValue.get(field.sourceType) ||
                          field.sourceType}
                      </p>
                    ) : null}
                    {field.subCompositions?.length ? (
                      <div className="mt-3 rounded-xl border border-border/70 bg-background/70 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                          Child Subcompositions ({field.subCompositions.length})
                        </p>
                        <div className="space-y-1.5">
                          {field.subCompositions.map((child) => (
                            <div
                              key={child.id}
                              className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
                            >
                              <Badge variant="outline" className="uppercase">
                                {child.inputType}
                              </Badge>
                              <span className="font-medium text-foreground/90">
                                {child.substanceName}
                              </span>
                              <span>CAS {child.substanceCode}</span>
                              <span>{Number(child.percentage).toFixed(2)}%</span>
                              <span>
                                {Number(child.projectedWeight).toFixed(3)} g
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetSubstanceDraft()
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Substance</DialogTitle>
            <DialogDescription>
              Capture either a chemical or manual substance with CAS mapping.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Input Type *</Label>
              <Select
                value={newSubstance.inputType}
                onValueChange={(value: CachedMaterialSubstanceInputType) =>
                  setNewSubstance((prev) => ({
                    ...prev,
                    inputType: value,
                    subCompositions:
                      value === 'manual' ? prev.subCompositions || [] : [],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {SUBSTANCE_INPUT_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Source Classification</Label>
              <Select
                value={newSubstance.sourceType}
                onValueChange={(value: CachedMaterialSubstanceSourceType) =>
                  setNewSubstance((prev) => ({
                    ...prev,
                    sourceType: value,
                    otherSourceReason:
                      value === 'other' ? prev.otherSourceReason : '',
                    reachRegistrationNumber:
                      value === 'no' ? prev.reachRegistrationNumber : '',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional classification" />
                </SelectTrigger>
                <SelectContent>
                  {SUBSTANCE_SOURCE_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Substance Name *</Label>
              <Input
                value={newSubstance.substanceName || ''}
                onChange={(e) =>
                  setNewSubstance((prev) => ({
                    ...prev,
                    substanceName: e.target.value,
                  }))
                }
                placeholder={
                  newSubstance.inputType === 'manual'
                    ? 'Enter manual substance name'
                    : 'Enter chemical name'
                }
              />
            </div>

            <div className="space-y-2">
              <Label>CAS Number *</Label>
              <Input
                value={newSubstance.substanceCode || ''}
                onChange={(e) =>
                  setNewSubstance((prev) => ({
                    ...prev,
                    substanceCode: e.target.value,
                  }))
                }
                placeholder="e.g., 50-00-0"
              />
            </div>

            <div className="space-y-2">
              <Label>Percentage of Component (%) *</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.000001"
                value={
                  newSubstance.percentage === undefined
                    ? ''
                    : newSubstance.percentage
                }
                onChange={(e) => handlePercentageChange(e.target.value)}
                placeholder="0.000000"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Projected Weight (grams)</Label>
              <Input
                readOnly
                value={Number(newSubstance.projectedWeight || 0).toFixed(6)}
              />
            </div>

            {newSubstance.inputType === 'manual' ? (
              <div className="surface-subtle sm:col-span-2 rounded-2xl border border-border/70 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">Child Subcompositions</p>
                    <p className="text-xs text-muted-foreground">
                      Add nested child rows for this manual substance. Total must
                      equal 100%.
                    </p>
                  </div>
                  <Badge variant="secondary" className="font-semibold">
                    {subCompositionPercentageTotal.toFixed(2)}%
                  </Badge>
                </div>

                {(newSubstance.subCompositions || []).length > 0 ? (
                  <div className="mb-4 space-y-2">
                    {(newSubstance.subCompositions || []).map((child, index) => (
                      <div
                        key={child.id || `${child.substanceCode}-${index}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-background/70 px-3 py-2"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <Badge variant="outline" className="uppercase">
                            {child.inputType}
                          </Badge>
                          <span className="font-semibold">
                            {child.substanceName}
                          </span>
                          <span className="text-muted-foreground">
                            CAS {child.substanceCode}
                          </span>
                          <span className="text-muted-foreground">
                            {Number(child.percentage).toFixed(2)}%
                          </span>
                          <span className="text-muted-foreground">
                            {Number(child.projectedWeight).toFixed(3)} g
                          </span>
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveSubComposition(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Child Type</Label>
                    <Select
                      value={newSubComposition.inputType}
                      onValueChange={(value: CachedMaterialSubstanceInputType) =>
                        setNewSubComposition((prev) => ({
                          ...prev,
                          inputType: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select child type" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBSTANCE_INPUT_TYPES.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Child Name</Label>
                    <Input
                      value={newSubComposition.substanceName || ''}
                      onChange={(e) =>
                        setNewSubComposition((prev) => ({
                          ...prev,
                          substanceName: e.target.value,
                        }))
                      }
                      placeholder="Enter child substance name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Child CAS</Label>
                    <Input
                      value={newSubComposition.substanceCode || ''}
                      onChange={(e) =>
                        setNewSubComposition((prev) => ({
                          ...prev,
                          substanceCode: e.target.value,
                        }))
                      }
                      placeholder="Enter child CAS"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Child Percentage (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.000001"
                      value={
                        newSubComposition.percentage === undefined
                          ? ''
                          : newSubComposition.percentage
                      }
                      onChange={(e) =>
                        handleSubCompositionPercentageChange(e.target.value)
                      }
                      placeholder="0.000000"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label>Child Projected Weight (grams)</Label>
                    <Input
                      readOnly
                      value={Number(
                        newSubComposition.projectedWeight || 0
                      ).toFixed(6)}
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 gap-2"
                  onClick={handleAddSubComposition}
                >
                  <Plus className="h-4 w-4" />
                  Add Child Subcomposition
                </Button>
              </div>
            ) : null}

            {newSubstance.sourceType === 'other' ? (
              <div className="space-y-2 sm:col-span-2">
                <Label>Exemption Reason *</Label>
                <Textarea
                  className="min-h-[88px]"
                  value={newSubstance.otherSourceReason || ''}
                  onChange={(e) =>
                    setNewSubstance((prev) => ({
                      ...prev,
                      otherSourceReason: e.target.value,
                    }))
                  }
                  placeholder="Explain why this substance is exempt"
                />
              </div>
            ) : null}

            {newSubstance.sourceType === 'no' ? (
              <div className="space-y-2 sm:col-span-2">
                <Label>REACH Registration Number *</Label>
                <Input
                  value={newSubstance.reachRegistrationNumber || ''}
                  onChange={(e) =>
                    setNewSubstance((prev) => ({
                      ...prev,
                      reachRegistrationNumber: e.target.value,
                    }))
                  }
                  placeholder="Enter REACH registration number"
                />
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleAddSubstance}>
              Add Substance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function MaterialPhotosStep() {
  const form = useFormContext<MaterialFormData>()
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
          <h3 className="font-medium">Component Photos</h3>
          <p className="text-sm text-muted-foreground">
            Add images of this material. Drag to reorder.
          </p>
        </div>
      </div>

      <ImageUploader
        images={photos}
        onChange={handlePhotosChange}
        maxImages={6}
      />
    </div>
  )
}

function MaterialCertificatesStep() {
  const form = useFormContext<MaterialFormData>()
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'certificates',
  })

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newCert, setNewCert] = useState<Partial<CertificateData>>({
    type: '',
    number: '',
    expiryDate: '',
    weight: undefined,
    files: [],
  })

  const handleAddCertificate = () => {
    if (!newCert.type || !newCert.number || !newCert.expiryDate) {
      toast.error('Please fill in all required fields')
      return
    }

    append({
      id: crypto.randomUUID(),
      type: newCert.type,
      number: newCert.number,
      expiryDate: newCert.expiryDate,
      weight: newCert.weight,
      files: newCert.files || [],
    })

    setNewCert({
      type: '',
      number: '',
      expiryDate: '',
      weight: undefined,
      files: [],
    })
    setIsDialogOpen(false)
  }

  return (
    <>
      <div className="surface-subtle rounded-3xl p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <FileCheck className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-medium">Certificates</h3>
              <p className="text-sm text-muted-foreground">
                Add compliance and quality certificates
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Certificate
          </Button>
        </div>

        {fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12">
            <FileCheck className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              No certificates added yet
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              className="mt-4 gap-2"
            >
              <Plus className="h-4 w-4" />
              Add your first certificate
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-secondary/30 p-4 transition-colors hover:bg-secondary/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                  <FileCheck className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{field.type}</p>
                    <Badge variant="secondary" className="shrink-0">
                      #{field.number}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Expires: {field.expiryDate}</span>
                    {field.weight && (
                      <>
                        <span className="text-border">•</span>
                        <span>Weight: {field.weight}%</span>
                      </>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Certificate Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Certificate</DialogTitle>
            <DialogDescription>
              Add a compliance or quality certificate for this component.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Certificate Type *</Label>
              <Select
                value={newCert.type}
                onValueChange={(value) =>
                  setNewCert((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CERTIFICATE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Certificate Number *</Label>
              <Input
                value={newCert.number}
                onChange={(e) =>
                  setNewCert((prev) => ({ ...prev, number: e.target.value }))
                }
                placeholder="e.g., CERT-2024-001"
              />
            </div>

            <div className="space-y-2">
              <Label>Expiry Date *</Label>
              <Input
                type="date"
                value={newCert.expiryDate}
                onChange={(e) =>
                  setNewCert((prev) => ({
                    ...prev,
                    expiryDate: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Weight (% of total composition)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={newCert.weight || ''}
                onChange={(e) =>
                  setNewCert((prev) => ({
                    ...prev,
                    weight: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                placeholder="e.g., 50"
              />
            </div>

            <div className="space-y-2">
              <Label>Certificate Document</Label>
              <FileUploader
                files={(newCert.files as UploadedFile[]) || []}
                onChange={(files) => setNewCert((prev) => ({ ...prev, files }))}
                accept=".pdf,.jpg,.jpeg,.png"
                maxFiles={1}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleAddCertificate}>
              Add Certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Need to add Label import
function Label({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={cn('text-sm font-medium', className)}>{children}</label>
  )
}

// Mode selection screen
function ModeSelectionScreen({
  onSelectMode,
  hasDraft,
  onResumeDraft,
}: {
  onSelectMode: (mode: CreationMode) => void
  hasDraft: boolean
  onResumeDraft: () => void
}) {
  const navigate = useNavigate()
  const [selectedMode, setSelectedMode] = useState<CreationMode>('quick')

  return (
    <div className="relative min-h-screen">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-32 top-[-8rem] h-[22rem] w-[22rem] rounded-full bg-[hsl(16_96%_58%/.16)] blur-3xl" />
        <div className="absolute right-[-8rem] top-[20%] h-[20rem] w-[20rem] rounded-full bg-[hsl(222_90%_56%/.12)] blur-3xl" />
        <div className="page-grain absolute inset-0 opacity-[0.28]" />
      </div>

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="animate-fade-up text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
            <Layers className="h-8 w-8 text-accent" />
          </div>
          <h1 className="mt-6 text-3xl sm:text-4xl">Create Component</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            How would you like to add your component?
          </p>
        </div>

        <div className="animate-fade-up stagger-1 mt-10">
          <CreationModePicker
            value={selectedMode}
            onChange={setSelectedMode}
            quickTitle="Quick Add"
            quickDescription="Name, unit, and cost. Add substances and certs later."
            fullTitle="Full Details"
            fullDescription="Complete all information including specs and certificates."
          />
        </div>

        {hasDraft && (
          <div className="animate-fade-up stagger-2 mt-6">
            <button
              type="button"
              onClick={onResumeDraft}
              className="w-full rounded-2xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 p-4 text-left transition-colors hover:border-amber-500/60 hover:bg-amber-500/10"
            >
              <p className="font-medium text-amber-600">Resume Draft</p>
              <p className="mt-1 text-sm text-muted-foreground">
                You have an unsaved component draft. Continue where you left off.
              </p>
            </button>
          </div>
        )}

        <div className="animate-fade-up stagger-3 mt-8 flex justify-center gap-3">
          <Button variant="outline" onClick={() => navigate('/catalog')}>
            Cancel
          </Button>
          <Button variant="accent" onClick={() => onSelectMode(selectedMode)}>
            Continue
          </Button>
        </div>
      </main>
    </div>
  )
}

// Main component
export function CreateMaterialPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState<CreationMode | 'selecting' | null>(null)
  const [hasDraft, setHasDraft] = useState(false)

  // Check for draft and URL params on mount
  useEffect(() => {
    const draft = getCachedDraft<Partial<MaterialFormData>>(
      MATERIAL_CREATION_DRAFT_KEY
    )
    setHasDraft(!!draft)

    // If mode is specified in URL, use it directly
    const urlMode = searchParams.get('mode')
    if (urlMode === 'quick' || urlMode === 'full') {
      setMode(urlMode)
    } else if (draft) {
      // If there's a draft, show selection screen
      setMode('selecting')
    } else {
      // Default to selection screen
      setMode('selecting')
    }
  }, [searchParams])

  const handleModeSelect = useCallback((selectedMode: CreationMode) => {
    setMode(selectedMode)
  }, [])

  const handleResumeDraft = useCallback(() => {
    setMode('full')
  }, [])

  const handleQuickAddSuccess = useCallback(
    (componentId: string, continueToDetails: boolean) => {
      if (continueToDetails) {
        navigate(`/catalog/components/${componentId}`)
      } else {
        navigate('/catalog')
      }
    },
    [navigate]
  )

  const handleQuickAddCancel = useCallback(() => {
    setMode('selecting')
  }, [])

  // Show loading state while determining mode
  if (mode === null) {
    return null
  }

  // Show mode selection screen
  if (mode === 'selecting') {
    return (
      <ModeSelectionScreen
        onSelectMode={handleModeSelect}
        hasDraft={hasDraft}
        onResumeDraft={handleResumeDraft}
      />
    )
  }

  // Show quick add form
  if (mode === 'quick') {
    return (
      <QuickAddComponent
        onSuccess={handleQuickAddSuccess}
        onCancel={handleQuickAddCancel}
      />
    )
  }

  // Show full creation flow
  return <FullMaterialCreationFlow />
}

// Full creation flow (extracted from original CreateMaterialPage)
function FullMaterialCreationFlow() {
  const navigate = useNavigate()
  const [hasDraft, setHasDraft] = useState(false)

  const form = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: MATERIAL_DEFAULT_VALUES,
    mode: 'onChange',
  })
  const watchedValues = form.watch()

  useEffect(() => {
    const draft = getCachedDraft<Partial<MaterialFormData>>(
      MATERIAL_CREATION_DRAFT_KEY
    )
    if (!draft) return

    form.reset({
      ...MATERIAL_DEFAULT_VALUES,
      ...draft,
    })
    setHasDraft(true)
  }, [form])

  useEffect(() => {
    if (!form.formState.isDirty) return

    const timeoutId = window.setTimeout(() => {
      setCachedDraft(MATERIAL_CREATION_DRAFT_KEY, watchedValues)
      setHasDraft(true)
    }, 350)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [watchedValues, form.formState.isDirty])

  const steps: CreationStep[] = useMemo(
    () => [
      {
        id: 'info',
        title: 'Component Information',
        description: 'Name, description, and cost details',
        content: <MaterialInfoStep />,
        validate: async () => {
          return await form.trigger([
            'name',
            'unitOfMeasurement',
            'unitCost',
            'unitCostCurrency',
          ])
        },
      },
      {
        id: 'specs',
        title: 'Physical Specifications',
        description: 'Weight and dimensions of the component',
        content: <MaterialSpecsStep />,
        validate: async () => {
          return await form.trigger(['weight'])
        },
      },
      {
        id: 'substances',
        title: 'Substances',
        description: 'Chemical and manual substances with CAS',
        content: <MaterialSubstancesStep />,
        validate: async () => {
          const isValid = await form.trigger('substances')
          if (!isValid) return false

          const totalPercentage = (form.getValues('substances') || []).reduce(
            (sum, substance) => sum + Number(substance.percentage || 0),
            0
          )

          if (totalPercentage > 100.000001) {
            toast.error('Total substance composition cannot exceed 100%')
            return false
          }

          return true
        },
      },
      {
        id: 'photos',
        title: 'Component Photos',
        description: 'Visual documentation of the material',
        content: <MaterialPhotosStep />,
      },
      {
        id: 'certificates',
        title: 'Certificates',
        description: 'Compliance and quality certifications',
        content: <MaterialCertificatesStep />,
      },
    ],
    [form]
  )

  const completedCoreFields = useMemo(() => {
    const requiredFields = [
      watchedValues.name,
      watchedValues.unitOfMeasurement,
      watchedValues.unitCostCurrency,
      watchedValues.weight > 0 ? 'weight' : '',
    ]

    return requiredFields.filter((value) => String(value || '').trim()).length
  }, [
    watchedValues.name,
    watchedValues.unitCostCurrency,
    watchedValues.unitOfMeasurement,
    watchedValues.weight,
  ])

  const completionPercentage = Math.round((completedCoreFields / 4) * 100)
  const substanceCompositionTotal = useMemo(() => {
    return (watchedValues.substances || []).reduce(
      (sum, substance) => sum + Number(substance.percentage || 0),
      0
    )
  }, [watchedValues.substances])

  const sidebarPanel = useMemo(() => {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Component Snapshot
          </p>
          <Badge variant="secondary" className="font-semibold">
            {completionPercentage}%
          </Badge>
        </div>

        <div>
          <Progress value={completionPercentage} className="h-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            Complete naming, costing, unit, and weight before publishing.
          </p>
        </div>

        <dl className="space-y-2 text-sm">
          <div className="rounded-xl bg-card/70 px-3 py-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Component
            </dt>
            <dd className="mt-1 font-semibold">
              {watchedValues.name || 'Unnamed component'}
            </dd>
          </div>
          <div className="rounded-xl bg-card/70 px-3 py-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Cost
            </dt>
            <dd className="mt-1 font-semibold text-foreground/90">
              {watchedValues.unitCostCurrency || 'USD'}{' '}
              {Number(watchedValues.unitCost || 0).toFixed(2)} /{' '}
              {watchedValues.unitOfMeasurement || 'unit'}
            </dd>
          </div>
          <div className="rounded-xl bg-card/70 px-3 py-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Photos
            </dt>
            <dd className="mt-1 font-semibold text-foreground/90">
              {watchedValues.photos?.length || 0} photo
              {(watchedValues.photos?.length || 0) === 1 ? '' : 's'}
            </dd>
          </div>
          <div className="rounded-xl bg-card/70 px-3 py-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Certificates
            </dt>
            <dd className="mt-1 font-semibold text-foreground/90">
              {watchedValues.certificates?.length || 0} item
              {(watchedValues.certificates?.length || 0) === 1 ? '' : 's'}
            </dd>
          </div>
          <div className="rounded-xl bg-card/70 px-3 py-2">
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Substances
            </dt>
            <dd className="mt-1 font-semibold text-foreground/90">
              {watchedValues.substances?.length || 0} item
              {(watchedValues.substances?.length || 0) === 1 ? '' : 's'} •{' '}
              {substanceCompositionTotal.toFixed(2)}%
            </dd>
          </div>
        </dl>
      </div>
    )
  }, [
    completionPercentage,
    watchedValues.certificates?.length,
    watchedValues.name,
    watchedValues.photos?.length,
    watchedValues.substances?.length,
    watchedValues.unitCost,
    watchedValues.unitCostCurrency,
    watchedValues.unitOfMeasurement,
    substanceCompositionTotal,
  ])

  const handleSaveDraft = useCallback(() => {
    setCachedDraft(MATERIAL_CREATION_DRAFT_KEY, form.getValues())
    setHasDraft(true)
    toast.success('Component draft saved locally')
  }, [form])

  const handleDiscardDraft = useCallback(() => {
    clearCachedDraft(MATERIAL_CREATION_DRAFT_KEY)
    setHasDraft(false)
    toast.success('Saved component draft cleared')
  }, [])

  const handleSubmit = useCallback(
    async (data: MaterialFormData) => {
      try {
        const created = createCachedMaterial({
          ...data,
          photos: data.photos.map((photo) => ({
            id: photo.id,
            url: photo.url,
            name: photo.name,
            size: photo.size,
            contentType: photo.contentType,
          })),
          certificates: data.certificates.map((certificate) => ({
            ...certificate,
            files: certificate.files.map((file: UploadedFile) => ({
              id: file.id,
              name: file.name,
              size: file.size,
              type: file.type,
              url: file.url,
            })),
          })),
          substances: data.substances.map((substance) => ({
            id: substance.id,
            inputType: substance.inputType,
            substanceName: substance.substanceName.trim(),
            substanceCode: substance.substanceCode.trim(),
            percentage: substance.percentage,
            projectedWeight: substance.projectedWeight,
            subCompositions: (substance.subCompositions || []).map((child) => ({
              id: child.id,
              inputType: child.inputType,
              substanceName: child.substanceName.trim(),
              substanceCode: child.substanceCode.trim(),
              percentage: child.percentage,
              projectedWeight: child.projectedWeight,
              supplierId: (child as { supplierId?: string }).supplierId || '',
              supplierName: (child as { supplierName?: string }).supplierName || '',
              countryOfOrigin: (child as { countryOfOrigin?: string }).countryOfOrigin,
              reachRegistrationNumber: (child as { reachRegistrationNumber?: string }).reachRegistrationNumber,
              documents: (child as { documents?: { id: string; name: string; size: number; type: string; url?: string }[] }).documents || [],
            })),
            sourceType: substance.sourceType,
            otherSourceReason: substance.otherSourceReason?.trim() || undefined,
            reachRegistrationNumber:
              substance.reachRegistrationNumber?.trim() || undefined,
            supplierId: (substance as { supplierId?: string }).supplierId || '',
            supplierName: (substance as { supplierName?: string }).supplierName || '',
            countryOfOrigin: (substance as { countryOfOrigin?: string }).countryOfOrigin,
            documents: (substance as { documents?: { id: string; name: string; size: number; type: string; url?: string }[] }).documents || [],
          })),
        })

        clearCachedDraft(MATERIAL_CREATION_DRAFT_KEY)
        setHasDraft(false)
        toast.success(`"${created.name}" saved to local cache`)
        navigate('/materials')
      } catch (error) {
        console.error('Failed to create material:', error)
        toast.error('Unable to save component. Please try again.')
      }
    },
    [navigate]
  )

  return (
    <CreationFlow
      title="Create Component"
      subtitle="Add a new material or component"
      steps={steps}
      form={form}
      onSubmit={handleSubmit}
      submitLabel="Create Component"
      backPath="/materials"
      sidebarPanel={sidebarPanel}
      hasDraft={hasDraft}
      onSaveDraft={handleSaveDraft}
      onDiscardDraft={handleDiscardDraft}
    />
  )
}
