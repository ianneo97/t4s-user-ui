import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  AlertTriangle,
  ArrowLeft,
  Beaker,
  Building2,
  ChevronDown,
  Edit3,
  FileCheck,
  FileText,
  FlaskConical,
  Layers,
  MoreHorizontal,
  Percent,
  Plus,
  Save,
  Scale,
  Trash2,
  Upload,
  X,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  getCachedMaterialById,
  updateCachedMaterial,
  deleteCachedMaterial,
  getCachedSuppliers,
  type CachedMaterial,
  type CachedMaterialSubstance,
  type CachedMaterialSubstanceInputType,
  type CachedMaterialSubstanceSourceType,
  type CachedUploadedFile,
  type CachedSupplier,
} from '@/infrastructure/cache/catalog-cache'
import { cn } from '@/lib/utils'

// Constants
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
}[] = [
  { value: 'natural', label: 'Exempt - Natural' },
  { value: 'eu', label: 'Exempt - EU Source' },
  { value: 'other', label: 'Exempt - Other' },
  { value: 'no', label: 'Not Exempt' },
]


// Schemas
const componentSchema = z.object({
  name: z.string().min(1, 'Component name is required'),
  description: z.string().optional(),
  unitOfMeasurement: z.string().min(1, 'Unit of measurement is required'),
  unitCost: z.coerce.number().min(0),
  unitCostCurrency: z.string().min(1, 'Currency is required'),
  weight: z.coerce.number().min(0),
  length: z.coerce.number().optional(),
  width: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
})

type ComponentFormData = z.infer<typeof componentSchema>

function calculateProjectedWeight(weight: number, percentage: number): number {
  if (!Number.isFinite(weight) || !Number.isFinite(percentage)) return 0
  return Number(((weight * percentage) / 100).toFixed(6))
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Substance Card Component
function SubstanceCard({
  substance,
  onEdit,
  onDelete,
}: {
  substance: CachedMaterialSubstance
  onEdit: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const hasSubCompositions = (substance.subCompositions?.length || 0) > 0

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 transition-all hover:border-border hover:bg-card">
      <div className="flex items-start gap-4 p-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
          <Beaker className="h-4 w-4 text-emerald-600" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold">{substance.substanceName}</h4>
            <Badge variant="secondary" className="text-[10px] uppercase">
              {substance.inputType}
            </Badge>
            <Badge variant="outline" className="font-mono text-[10px]">
              CAS {substance.substanceCode}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Percent className="h-3 w-3" />
              {substance.percentage.toFixed(2)}%
            </span>
            <span className="flex items-center gap-1">
              <Scale className="h-3 w-3" />
              {substance.projectedWeight.toFixed(3)}g
            </span>
            {substance.sourceType && (
              <Badge variant="outline" className="text-[10px]">
                {SUBSTANCE_SOURCE_TYPES.find((t) => t.value === substance.sourceType)?.label}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {hasSubCompositions && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(!expanded)}
              className="h-8 w-8"
            >
              <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {expanded && hasSubCompositions && (
        <div className="border-t border-border/60 px-4 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Child Subcompositions
          </p>
          <div className="space-y-2">
            {substance.subCompositions.map((child) => (
              <div
                key={child.id}
                className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {child.inputType}
                  </Badge>
                  <span className="font-medium">{child.substanceName}</span>
                  <span className="text-muted-foreground">CAS {child.substanceCode}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>{child.percentage.toFixed(2)}%</span>
                  <span>{child.projectedWeight.toFixed(3)}g</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Sub-composition type - matches CachedMaterialSubComposition
interface SubCompositionData {
  id: string
  inputType: CachedMaterialSubstanceInputType
  substanceName: string
  substanceCode: string
  percentage: number
  projectedWeight: number
  supplierId: string
  supplierName: string
  countryOfOrigin?: string
  reachRegistrationNumber?: string
  documents: CachedUploadedFile[]
}

// Substance form data with supplier and documents
interface SubstanceFormDataExtended {
  inputType: CachedMaterialSubstanceInputType
  substanceName: string
  substanceCode: string
  percentage?: number
  projectedWeight: number
  subCompositions: SubCompositionData[]
  sourceType?: CachedMaterialSubstanceSourceType
  otherSourceReason?: string
  reachRegistrationNumber?: string
  supplierId: string
  supplierName: string
  countryOfOrigin?: string
  documents: CachedUploadedFile[]
}

// Document upload helper component
function DocumentUploadSection({
  documents,
  onAddDocument,
  onRemoveDocument,
  label = 'SDS Documents',
}: {
  documents: CachedUploadedFile[]
  onAddDocument: (file: File) => void
  onRemoveDocument: (index: number) => void
  label?: string
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onAddDocument(file)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="space-y-2">
        {documents.map((doc, index) => (
          <div
            key={doc.id}
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-xs"
          >
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="flex-1 truncate">{doc.name}</span>
            <span className="text-muted-foreground">{(doc.size / 1024).toFixed(1)}KB</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => onRemoveDocument(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border/70 bg-secondary/20 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-border hover:bg-secondary/40">
          <Upload className="h-3.5 w-3.5" />
          <span>Upload document</span>
          <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
        </label>
      </div>
    </div>
  )
}

// Supplier selector component - uses cached suppliers
function SupplierSelector({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (supplierId: string, supplierName: string, countryOfOrigin?: string) => void
  className?: string
}) {
  const [suppliers, setSuppliers] = useState<CachedSupplier[]>([])

  useEffect(() => {
    setSuppliers(getCachedSuppliers())
  }, [])

  if (suppliers.length === 0) {
    return (
      <div className={cn('flex items-center gap-2 rounded-md border border-border/60 bg-secondary/30 px-3 py-2 text-sm text-muted-foreground', className)}>
        <Building2 className="h-3.5 w-3.5" />
        <span>No suppliers available</span>
        <a href="/suppliers" className="ml-auto text-xs text-primary hover:underline">
          Add suppliers
        </a>
      </div>
    )
  }

  return (
    <Select
      value={value}
      onValueChange={(supplierId) => {
        const supplier = suppliers.find((s) => s.id === supplierId)
        if (supplier) {
          onChange(supplier.id, supplier.name, supplier.countryOfOrigin)
        }
      }}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select supplier" />
      </SelectTrigger>
      <SelectContent>
        {suppliers.map((supplier) => (
          <SelectItem key={supplier.id} value={supplier.id}>
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{supplier.name}</span>
              <span className="text-xs text-muted-foreground">({supplier.countryOfOrigin})</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Add/Edit Substance Dialog
function SubstanceDialog({
  open,
  onOpenChange,
  substance,
  componentWeight,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  substance: CachedMaterialSubstance | null
  componentWeight: number
  onSave: (data: CachedMaterialSubstance) => void
}) {
  const [formData, setFormData] = useState<Partial<SubstanceFormDataExtended>>({
    inputType: 'chemical',
    substanceName: '',
    substanceCode: '',
    percentage: undefined,
    projectedWeight: 0,
    subCompositions: [],
    sourceType: undefined,
    otherSourceReason: '',
    reachRegistrationNumber: '',
    supplierId: '',
    supplierName: '',
    countryOfOrigin: '',
    documents: [],
  })

  const [newSubComposition, setNewSubComposition] = useState<Partial<SubCompositionData>>({
    inputType: 'chemical',
    substanceName: '',
    substanceCode: '',
    percentage: undefined,
    projectedWeight: 0,
    supplierId: '',
    supplierName: '',
    countryOfOrigin: '',
    reachRegistrationNumber: '',
    documents: [],
  })

  useEffect(() => {
    if (open && substance) {
      setFormData({
        ...substance,
        percentage: substance.percentage,
        projectedWeight: substance.projectedWeight,
        subCompositions: substance.subCompositions || [],
        supplierId: substance.supplierId || '',
        supplierName: substance.supplierName || '',
        countryOfOrigin: substance.countryOfOrigin || '',
        documents: substance.documents || [],
      })
    } else if (open) {
      setFormData({
        inputType: 'chemical',
        substanceName: '',
        substanceCode: '',
        percentage: undefined,
        projectedWeight: 0,
        subCompositions: [],
        sourceType: undefined,
        otherSourceReason: '',
        reachRegistrationNumber: '',
        supplierId: '',
        supplierName: '',
        countryOfOrigin: '',
        documents: [],
      })
    }
    setNewSubComposition({
      inputType: 'chemical',
      substanceName: '',
      substanceCode: '',
      percentage: undefined,
      projectedWeight: 0,
      supplierId: '',
      supplierName: '',
      countryOfOrigin: '',
      reachRegistrationNumber: '',
      documents: [],
    })
  }, [open, substance])

  const subCompositionPercentageTotal = useMemo(() => {
    return (formData.subCompositions || []).reduce(
      (sum, item) => sum + Number(item.percentage || 0),
      0
    )
  }, [formData.subCompositions])

  const handlePercentageChange = useCallback((rawValue: string) => {
    const percentage = rawValue === '' ? undefined : Number(rawValue)
    const projectedWeight = calculateProjectedWeight(componentWeight, Number(percentage || 0))
    setFormData((prev) => ({
      ...prev,
      percentage,
      projectedWeight,
      subCompositions: (prev.subCompositions || []).map((sub) => ({
        ...sub,
        projectedWeight: calculateProjectedWeight(projectedWeight, Number(sub.percentage || 0)),
      })),
    }))
  }, [componentWeight])

  const handleSubCompositionPercentageChange = useCallback((rawValue: string) => {
    const percentage = rawValue === '' ? undefined : Number(rawValue)
    const parentProjectedWeight = Number(formData.projectedWeight || 0)
    setNewSubComposition((prev) => ({
      ...prev,
      percentage,
      projectedWeight: calculateProjectedWeight(parentProjectedWeight, Number(percentage || 0)),
    }))
  }, [formData.projectedWeight])

  const handleAddSubComposition = useCallback(() => {
    const substanceName = newSubComposition.substanceName?.trim()
    const substanceCode = newSubComposition.substanceCode?.trim()
    const percentage = Number(newSubComposition.percentage || 0)
    const parentProjectedWeight = Number(formData.projectedWeight || 0)

    if (!newSubComposition.inputType || !substanceName || !substanceCode) {
      toast.error('Child composition type, name, and CAS number are required')
      return
    }

    if (!newSubComposition.supplierId || !newSubComposition.supplierName) {
      toast.error('Supplier is required for child composition')
      return
    }

    if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
      toast.error('Child composition percentage must be between 0 and 100')
      return
    }

    if (subCompositionPercentageTotal + percentage > 100.000001) {
      toast.error(
        `Child composition total exceeds 100%. Remaining budget: ${Math.max(
          100 - subCompositionPercentageTotal,
          0
        ).toFixed(2)}%`
      )
      return
    }

    setFormData((prev) => ({
      ...prev,
      subCompositions: [
        ...(prev.subCompositions || []),
        {
          id: crypto.randomUUID(),
          inputType: newSubComposition.inputType || 'chemical',
          substanceName,
          substanceCode,
          percentage,
          projectedWeight: calculateProjectedWeight(parentProjectedWeight, percentage),
          supplierId: newSubComposition.supplierId || '',
          supplierName: newSubComposition.supplierName || '',
          countryOfOrigin: newSubComposition.countryOfOrigin,
          reachRegistrationNumber: newSubComposition.reachRegistrationNumber,
          documents: newSubComposition.documents || [],
        },
      ],
    }))

    setNewSubComposition({
      inputType: 'chemical',
      substanceName: '',
      substanceCode: '',
      percentage: undefined,
      projectedWeight: 0,
      supplierId: '',
      supplierName: '',
      countryOfOrigin: '',
      reachRegistrationNumber: '',
      documents: [],
    })
  }, [newSubComposition, formData.projectedWeight, subCompositionPercentageTotal])

  const handleRemoveSubComposition = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      subCompositions: (prev.subCompositions || []).filter((_, i) => i !== index),
    }))
  }, [])

  const handleAddParentDocument = useCallback((file: File) => {
    const newDoc: CachedUploadedFile = {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
    }
    setFormData((prev) => ({
      ...prev,
      documents: [...(prev.documents || []), newDoc],
    }))
  }, [])

  const handleRemoveParentDocument = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      documents: (prev.documents || []).filter((_, i) => i !== index),
    }))
  }, [])

  const handleAddChildDocument = useCallback((file: File) => {
    const newDoc: CachedUploadedFile = {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
    }
    setNewSubComposition((prev) => ({
      ...prev,
      documents: [...(prev.documents || []), newDoc],
    }))
  }, [])

  const handleRemoveChildDocument = useCallback((index: number) => {
    setNewSubComposition((prev) => ({
      ...prev,
      documents: (prev.documents || []).filter((_, i) => i !== index),
    }))
  }, [])

  const handleSave = () => {
    if (!formData.inputType || !formData.substanceName?.trim() || !formData.substanceCode?.trim()) {
      toast.error('Substance type, name, and CAS number are required')
      return
    }

    if (!formData.supplierId || !formData.supplierName) {
      toast.error('Supplier is required')
      return
    }

    const percentage = Number(formData.percentage || 0)
    if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
      toast.error('Percentage must be between 0 and 100')
      return
    }

    if (formData.sourceType === 'other' && !formData.otherSourceReason?.trim()) {
      toast.error('Please provide an exemption reason')
      return
    }

    if (formData.sourceType === 'no' && !formData.reachRegistrationNumber?.trim()) {
      toast.error('REACH registration number is required')
      return
    }

    const subCompositions = formData.subCompositions || []
    if (formData.inputType === 'manual' && subCompositions.length > 0) {
      const childTotal = subCompositions.reduce((sum, item) => sum + Number(item.percentage || 0), 0)
      if (Math.abs(childTotal - 100) > 0.000001) {
        toast.error(`Manual substance child composition total must equal 100% (currently ${childTotal.toFixed(2)}%)`)
        return
      }
    }

    onSave({
      id: substance?.id || crypto.randomUUID(),
      inputType: formData.inputType as CachedMaterialSubstanceInputType,
      substanceName: formData.substanceName.trim(),
      substanceCode: formData.substanceCode.trim(),
      percentage,
      projectedWeight: calculateProjectedWeight(componentWeight, percentage),
      subCompositions: subCompositions.map((sub) => ({
        id: sub.id || crypto.randomUUID(),
        inputType: sub.inputType || 'chemical',
        substanceName: String(sub.substanceName || '').trim(),
        substanceCode: String(sub.substanceCode || '').trim(),
        percentage: Number(sub.percentage || 0),
        projectedWeight: Number(sub.projectedWeight || 0),
        supplierId: sub.supplierId || '',
        supplierName: sub.supplierName || '',
        countryOfOrigin: sub.countryOfOrigin,
        reachRegistrationNumber: sub.reachRegistrationNumber,
        documents: sub.documents || [],
      })),
      sourceType: formData.sourceType as CachedMaterialSubstanceSourceType | undefined,
      otherSourceReason: formData.otherSourceReason?.trim(),
      reachRegistrationNumber: formData.reachRegistrationNumber?.trim(),
      supplierId: formData.supplierId,
      supplierName: formData.supplierName,
      countryOfOrigin: formData.countryOfOrigin,
      documents: formData.documents || [],
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{substance ? 'Edit Substance' : 'Add Substance'}</DialogTitle>
          <DialogDescription>
            {substance ? 'Update substance details' : 'Add a new substance to this component'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Input Type *</label>
              <Select
                value={formData.inputType}
                onValueChange={(value: CachedMaterialSubstanceInputType) =>
                  setFormData((prev) => ({
                    ...prev,
                    inputType: value,
                    subCompositions: value === 'manual' ? prev.subCompositions || [] : [],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {SUBSTANCE_INPUT_TYPES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Source Classification</label>
              <Select
                value={formData.sourceType || ''}
                onValueChange={(value: CachedMaterialSubstanceSourceType) =>
                  setFormData((prev) => ({ ...prev, sourceType: value || undefined }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {SUBSTANCE_SOURCE_TYPES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Substance Name *</label>
            <Input
              value={formData.substanceName || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, substanceName: e.target.value }))}
              placeholder="Enter substance name"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">CAS Number *</label>
              <Input
                value={formData.substanceCode || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, substanceCode: e.target.value }))}
                placeholder="e.g., 50-00-0"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Percentage (%)*</label>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.000001"
                value={formData.percentage === undefined ? '' : formData.percentage}
                onChange={(e) => handlePercentageChange(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Projected Weight (g)</label>
            <Input readOnly value={Number(formData.projectedWeight || 0).toFixed(6)} />
          </div>

          {/* Supplier Selection - Mandatory */}
          <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
            <div className="mb-3">
              <p className="text-sm font-semibold">Supplier Information *</p>
              <p className="text-xs text-muted-foreground">
                Select the supplier for this substance
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Supplier *</label>
                <SupplierSelector
                  value={formData.supplierId || ''}
                  onChange={(supplierId, supplierName, countryOfOrigin) =>
                    setFormData((prev) => ({
                      ...prev,
                      supplierId,
                      supplierName,
                      countryOfOrigin,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Country of Origin</label>
                <Input
                  readOnly
                  value={formData.countryOfOrigin || ''}
                  placeholder="Select supplier to populate"
                  className="bg-secondary/30"
                />
              </div>
            </div>

            <div className="mt-4">
              <DocumentUploadSection
                documents={formData.documents || []}
                onAddDocument={handleAddParentDocument}
                onRemoveDocument={handleRemoveParentDocument}
                label="SDS Documents (Safety Data Sheets)"
              />
            </div>
          </div>

          {/* Manual substance - Child Subcompositions */}
          {formData.inputType === 'manual' && (
            <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">Child Compositions</p>
                  <p className="text-xs text-muted-foreground">
                    Add nested child rows for this manual substance. Total must equal 100%.
                  </p>
                </div>
                <Badge variant="secondary" className="font-semibold">
                  {subCompositionPercentageTotal.toFixed(2)}%
                </Badge>
              </div>

              {/* Existing sub-compositions */}
              {(formData.subCompositions || []).length > 0 && (
                <div className="mb-4 space-y-2">
                  {(formData.subCompositions || []).map((child, index) => (
                    <div
                      key={child.id || `${child.substanceCode}-${index}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 bg-background/70 px-3 py-2"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant="outline" className="uppercase">
                          {child.inputType}
                        </Badge>
                        <span className="font-semibold">{child.substanceName}</span>
                        <span className="text-muted-foreground">CAS {child.substanceCode}</span>
                        <span className="text-muted-foreground">{Number(child.percentage).toFixed(2)}%</span>
                        <span className="text-muted-foreground">{Number(child.projectedWeight).toFixed(3)}g</span>
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
              )}

              {/* Add new sub-composition form */}
              <div className="rounded-xl border border-border/60 bg-background/50 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Add New Child Composition
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Child Type *</label>
                    <Select
                      value={newSubComposition.inputType}
                      onValueChange={(value: CachedMaterialSubstanceInputType) =>
                        setNewSubComposition((prev) => ({ ...prev, inputType: value }))
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select child type" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBSTANCE_INPUT_TYPES.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Child Name *</label>
                    <Input
                      className="h-9"
                      value={newSubComposition.substanceName || ''}
                      onChange={(e) =>
                        setNewSubComposition((prev) => ({ ...prev, substanceName: e.target.value }))
                      }
                      placeholder="Enter child substance name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Child CAS *</label>
                    <Input
                      className="h-9"
                      value={newSubComposition.substanceCode || ''}
                      onChange={(e) =>
                        setNewSubComposition((prev) => ({ ...prev, substanceCode: e.target.value }))
                      }
                      placeholder="Enter child CAS"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Child Percentage (%) *</label>
                    <Input
                      className="h-9"
                      type="number"
                      min={0}
                      max={100}
                      step="0.000001"
                      value={newSubComposition.percentage === undefined ? '' : newSubComposition.percentage}
                      onChange={(e) => handleSubCompositionPercentageChange(e.target.value)}
                      placeholder="0.000000"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Child Projected Weight (g)</label>
                    <Input
                      className="h-9"
                      readOnly
                      value={Number(newSubComposition.projectedWeight || 0).toFixed(6)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Child Supplier *</label>
                    <SupplierSelector
                      value={newSubComposition.supplierId || ''}
                      onChange={(supplierId, supplierName, countryOfOrigin) =>
                        setNewSubComposition((prev) => ({
                          ...prev,
                          supplierId,
                          supplierName,
                          countryOfOrigin,
                        }))
                      }
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Child Country of Origin</label>
                    <Input
                      className="h-9 bg-secondary/30"
                      readOnly
                      value={newSubComposition.countryOfOrigin || ''}
                      placeholder="Select supplier"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Child REACH Registration</label>
                    <Input
                      className="h-9"
                      value={newSubComposition.reachRegistrationNumber || ''}
                      onChange={(e) =>
                        setNewSubComposition((prev) => ({
                          ...prev,
                          reachRegistrationNumber: e.target.value,
                        }))
                      }
                      placeholder="Enter REACH number (optional)"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <DocumentUploadSection
                      documents={newSubComposition.documents || []}
                      onAddDocument={handleAddChildDocument}
                      onRemoveDocument={handleRemoveChildDocument}
                      label="Child SDS Documents"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-2"
                  onClick={handleAddSubComposition}
                >
                  <Plus className="h-4 w-4" />
                  Add Child Composition
                </Button>
              </div>
            </div>
          )}

          {formData.sourceType === 'other' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Exemption Reason *</label>
              <Textarea
                value={formData.otherSourceReason || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, otherSourceReason: e.target.value }))
                }
                placeholder="Explain why this substance is exempt"
              />
            </div>
          )}

          {formData.sourceType === 'no' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">REACH Registration Number *</label>
              <Input
                value={formData.reachRegistrationNumber || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, reachRegistrationNumber: e.target.value }))
                }
                placeholder="Enter REACH number"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{substance ? 'Save Changes' : 'Add Substance'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Main Component Detail Page
export function ComponentDetailPage() {
  const navigate = useNavigate()
  const { componentId } = useParams<{ componentId: string }>()

  const [component, setComponent] = useState<CachedMaterial | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [substanceDialogOpen, setSubstanceDialogOpen] = useState(false)
  const [editingSubstance, setEditingSubstance] = useState<CachedMaterialSubstance | null>(null)
  const [deleteSubstanceId, setDeleteSubstanceId] = useState<string | null>(null)

  const form = useForm<ComponentFormData>({
    resolver: zodResolver(componentSchema),
    defaultValues: {
      name: '',
      description: '',
      unitOfMeasurement: '',
      unitCost: 0,
      unitCostCurrency: 'USD',
      weight: 0,
    },
  })

  // Load component data
  useEffect(() => {
    if (!componentId) return
    const data = getCachedMaterialById(componentId)
    if (data) {
      setComponent(data)
      form.reset({
        name: data.name,
        description: data.description || '',
        unitOfMeasurement: data.unitOfMeasurement,
        unitCost: data.unitCost,
        unitCostCurrency: data.unitCostCurrency,
        weight: data.weight,
        length: data.length,
        width: data.width,
        height: data.height,
      })
    }
  }, [componentId, form])

  const substances = component?.substances || []
  const totalSubstancePercentage = substances.reduce((sum, s) => sum + s.percentage, 0)

  const handleSaveComponent = async (data: ComponentFormData) => {
    if (!componentId || !component) return

    setIsSaving(true)
    try {
      const updated = updateCachedMaterial(componentId, {
        ...data,
        photos: component.photos,
        certificates: component.certificates,
        substances: component.substances,
      })

      if (updated) {
        setComponent(updated)
        setIsEditing(false)
        toast.success('Component updated')
      } else {
        toast.error('Failed to update component')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteComponent = () => {
    if (!componentId) return

    const deleted = deleteCachedMaterial(componentId)
    if (deleted) {
      toast.success('Component deleted')
      navigate('/catalog')
    } else {
      toast.error('Failed to delete component')
    }
  }

  const handleSaveSubstance = (substanceData: CachedMaterialSubstance) => {
    if (!componentId || !component) return

    let updatedSubstances: CachedMaterialSubstance[]

    if (editingSubstance) {
      updatedSubstances = component.substances.map((s) =>
        s.id === substanceData.id ? substanceData : s
      )
    } else {
      updatedSubstances = [...component.substances, substanceData]
    }

    const updated = updateCachedMaterial(componentId, { substances: updatedSubstances })
    if (updated) {
      setComponent(updated)
      toast.success(editingSubstance ? 'Substance updated' : 'Substance added')
    }
    setEditingSubstance(null)
  }

  const handleDeleteSubstance = () => {
    if (!componentId || !component || !deleteSubstanceId) return

    const updatedSubstances = component.substances.filter((s) => s.id !== deleteSubstanceId)
    const updated = updateCachedMaterial(componentId, { substances: updatedSubstances })
    if (updated) {
      setComponent(updated)
      toast.success('Substance deleted')
    }
    setDeleteSubstanceId(null)
  }

  const openAddSubstance = () => {
    setEditingSubstance(null)
    setSubstanceDialogOpen(true)
  }

  const openEditSubstance = (substance: CachedMaterialSubstance) => {
    setEditingSubstance(substance)
    setSubstanceDialogOpen(true)
  }

  if (!component) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Layers className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h2 className="mt-4 text-xl font-semibold">Component not found</h2>
          <p className="mt-2 text-muted-foreground">
            This component may have been deleted or doesn't exist.
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
      {/* Background */}
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
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/catalog')}
                className="mt-1 h-9 w-9 shrink-0 rounded-lg"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="min-w-0">
                <Badge
                  variant="secondary"
                  className="text-[10px] font-semibold uppercase tracking-wider"
                >
                  Component
                </Badge>
                <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                  {component.name}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {component.unitCostCurrency} {component.unitCost.toFixed(2)} /{' '}
                  {component.unitOfMeasurement} · {component.weight}g
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsEditing(false)
                      form.reset()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="accent"
                    onClick={form.handleSubmit(handleSaveComponent)}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    {isSaving ? <Spinner size="sm" /> : <Save className="h-4 w-4" />}
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Edit3 className="mr-2 h-4 w-4" />
                        Edit Component
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteDialogOpen(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Component
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="border-b border-border/40 bg-secondary/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 overflow-x-auto py-4">
            <div className="flex shrink-0 items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-background/80">
                <Scale className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Weight</p>
                <p className="font-semibold tabular-nums">{component.weight}g</p>
              </div>
            </div>

            <div className="h-8 w-px bg-border/60" />

            <div className="flex shrink-0 items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-background/80">
                <FlaskConical className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Substances</p>
                <p className="font-semibold tabular-nums">{substances.length}</p>
              </div>
            </div>

            <div className="h-8 w-px bg-border/60" />

            <div className="flex shrink-0 items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-background/80">
                <Percent className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Composition</p>
                <p className={cn('font-semibold tabular-nums', totalSubstancePercentage > 100 && 'text-destructive')}>
                  {totalSubstancePercentage.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="h-8 w-px bg-border/60" />

            <div className="flex shrink-0 items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-background/80">
                <FileCheck className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Certificates</p>
                <p className="font-semibold tabular-nums">{component.certificates?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="space-y-6">
          {/* Component Details Section */}
          {isEditing ? (
            <section className="rounded-2xl border border-border/60 bg-card/40 p-6">
              <h2 className="mb-4 text-lg font-semibold">Component Details</h2>
              <form className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name *</label>
                    <Input {...form.register('name')} placeholder="Component name" />
                    {form.formState.errors.name && (
                      <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Weight (g) *</label>
                    <Input type="number" {...form.register('weight')} placeholder="0" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea {...form.register('description')} placeholder="Description" />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Unit of Measurement *</label>
                    <Select
                      value={form.watch('unitOfMeasurement')}
                      onValueChange={(v) => form.setValue('unitOfMeasurement', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS_OF_MEASURE.map((u) => (
                          <SelectItem key={u.value} value={u.value}>
                            {u.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Currency *</label>
                    <Select
                      value={form.watch('unitCostCurrency')}
                      onValueChange={(v) => form.setValue('unitCostCurrency', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Unit Cost *</label>
                    <Input type="number" step="0.01" {...form.register('unitCost')} placeholder="0.00" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Length (cm)</label>
                    <Input type="number" {...form.register('length')} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Width (cm)</label>
                    <Input type="number" {...form.register('width')} placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Height (cm)</label>
                    <Input type="number" {...form.register('height')} placeholder="0" />
                  </div>
                </div>
              </form>
            </section>
          ) : (
            <section className="rounded-2xl border border-border/60 bg-card/40 p-6">
              <h2 className="mb-4 text-lg font-semibold">Component Details</h2>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Name
                  </dt>
                  <dd className="mt-1 font-medium">{component.name}</dd>
                </div>
                {component.description && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Description
                    </dt>
                    <dd className="mt-1 text-muted-foreground">{component.description}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Unit Cost
                  </dt>
                  <dd className="mt-1 font-medium">
                    {component.unitCostCurrency} {component.unitCost.toFixed(2)} / {component.unitOfMeasurement}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Weight
                  </dt>
                  <dd className="mt-1 font-medium">{component.weight}g</dd>
                </div>
                {(component.length || component.width || component.height) && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Dimensions
                    </dt>
                    <dd className="mt-1 font-medium">
                      {[component.length, component.width, component.height].filter(Boolean).join(' × ')} cm
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Created
                  </dt>
                  <dd className="mt-1 text-muted-foreground">{formatDate(component.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Last Updated
                  </dt>
                  <dd className="mt-1 text-muted-foreground">{formatDate(component.updatedAt)}</dd>
                </div>
              </dl>
            </section>
          )}

          {/* Substances Section */}
          <section className="rounded-2xl border border-border/60 bg-card/40 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Bill of Substances</h2>
                <p className="text-sm text-muted-foreground">
                  {substances.length} substance{substances.length !== 1 ? 's' : ''} ·{' '}
                  {totalSubstancePercentage.toFixed(1)}% total composition
                </p>
              </div>
              <Button onClick={openAddSubstance} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Substance
              </Button>
            </div>

            {/* Composition progress */}
            <div className="mb-4 rounded-xl bg-secondary/40 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Composition</span>
                <span
                  className={cn(
                    'font-mono font-semibold',
                    totalSubstancePercentage > 100 && 'text-destructive'
                  )}
                >
                  {totalSubstancePercentage.toFixed(2)}%
                </span>
              </div>
              <Progress
                value={Math.min(totalSubstancePercentage, 100)}
                className={cn('mt-2 h-2', totalSubstancePercentage > 100 && '[&>div]:!bg-destructive')}
              />
            </div>

            {substances.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 py-12">
                <FlaskConical className="h-10 w-10 text-muted-foreground/40" />
                <p className="mt-4 text-muted-foreground">No substances added yet</p>
                <Button variant="outline" onClick={openAddSubstance} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Add First Substance
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {substances.map((substance) => (
                  <SubstanceCard
                    key={substance.id}
                    substance={substance}
                    onEdit={() => openEditSubstance(substance)}
                    onDelete={() => setDeleteSubstanceId(substance.id)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Certificates Section */}
          {component.certificates && component.certificates.length > 0 && (
            <section className="rounded-2xl border border-border/60 bg-card/40 p-6">
              <h2 className="mb-4 text-lg font-semibold">Certificates</h2>
              <div className="space-y-2">
                {component.certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="flex items-center gap-4 rounded-xl bg-secondary/40 p-3"
                  >
                    <FileCheck className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{cert.type}</p>
                      <p className="text-sm text-muted-foreground">
                        #{cert.number} · Expires {formatDate(cert.expiryDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Substance Dialog */}
      <SubstanceDialog
        open={substanceDialogOpen}
        onOpenChange={setSubstanceDialogOpen}
        substance={editingSubstance}
        componentWeight={component.weight}
        onSave={handleSaveSubstance}
      />

      {/* Delete Substance Confirmation */}
      <AlertDialog open={!!deleteSubstanceId} onOpenChange={() => setDeleteSubstanceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Substance</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this substance? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubstance}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Component Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Component
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{component.name}"? This will permanently remove the
              component and all its substances. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteComponent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Component
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
