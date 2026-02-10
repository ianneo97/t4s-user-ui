import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Layers,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronUp,
  Plus,
  Trash2,
  FlaskConical,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { createCachedMaterial } from '@/infrastructure/cache/catalog-cache'
import { cn } from '@/lib/utils'

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

interface StepConfig {
  id: string
  question: string
  hint: string
  field: 'name' | 'unitOfMeasurement' | 'unitCost' | 'unitCostCurrency' | 'substances'
  type: 'text' | 'select' | 'number' | 'substances'
  placeholder?: string
  options?: { value: string; label: string }[]
}

const STEPS: StepConfig[] = [
  {
    id: 'name',
    question: "What's this component called?",
    hint: 'Give it a clear, descriptive name for easy identification.',
    field: 'name',
    type: 'text',
    placeholder: 'e.g., Organic Cotton Fabric',
  },
  {
    id: 'unitOfMeasurement',
    question: 'How is it measured?',
    hint: 'Select the unit that best represents how this component is tracked.',
    field: 'unitOfMeasurement',
    type: 'select',
    options: UNITS,
  },
  {
    id: 'unitCost',
    question: 'What does it cost per unit?',
    hint: 'Enter the cost value for one unit of this component.',
    field: 'unitCost',
    type: 'number',
    placeholder: '0.00',
  },
  {
    id: 'unitCostCurrency',
    question: 'Which currency?',
    hint: 'Select the currency for the unit cost.',
    field: 'unitCostCurrency',
    type: 'select',
    options: CURRENCIES,
  },
  {
    id: 'substances',
    question: 'Any substances to declare?',
    hint: 'Add chemical substances for compliance tracking. You can skip this if none apply.',
    field: 'substances',
    type: 'substances',
  },
]

interface SubstanceData {
  name: string
  casNumber?: string
  percentage?: number
}

interface FormData {
  name: string
  unitOfMeasurement: string
  unitCost: string
  unitCostCurrency: string
}

export function CreateComponentV3Page() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    unitOfMeasurement: '',
    unitCost: '',
    unitCostCurrency: 'USD',
  })
  const [substances, setSubstances] = useState<SubstanceData[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const step = STEPS[currentStep]
  const progress = ((currentStep + 1) / STEPS.length) * 100
  const isLastStep = currentStep === STEPS.length - 1

  const currentValue = step.type === 'substances' ? '' : formData[step.field as keyof FormData]
  const isCurrentValid = step.type === 'substances' ? true : currentValue.trim().length > 0

  const handleNext = useCallback(() => {
    if (!isCurrentValid) return

    if (isLastStep) {
      handleSubmit()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }, [isCurrentValid, isLastStep])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }, [currentStep])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && isCurrentValid && step.type !== 'substances') {
        e.preventDefault()
        handleNext()
      }
    },
    [isCurrentValid, handleNext, step.type]
  )

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

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const created = createCachedMaterial({
        name: formData.name,
        description: '',
        unitOfMeasurement: formData.unitOfMeasurement,
        unitCost: parseFloat(formData.unitCost) || 0,
        unitCostCurrency: formData.unitCostCurrency,
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

      toast.success(`"${created.name}" created!`)
      navigate('/v3/catalog')
    } catch (error) {
      console.error('Failed to create component:', error)
      toast.error('Unable to create component. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepInput = () => {
    if (step.type === 'text') {
      return (
        <Input
          key={step.id}
          type="text"
          value={currentValue}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, [step.field]: e.target.value }))
          }
          onKeyDown={handleKeyDown}
          placeholder={step.placeholder}
          autoFocus
          className="h-14 rounded-xl text-center text-lg"
        />
      )
    }

    if (step.type === 'number') {
      return (
        <Input
          key={step.id}
          type="number"
          min={0}
          step={0.01}
          value={currentValue}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, [step.field]: e.target.value }))
          }
          onKeyDown={handleKeyDown}
          placeholder={step.placeholder}
          autoFocus
          className="h-14 rounded-xl text-center text-lg"
        />
      )
    }

    if (step.type === 'select') {
      return (
        <Select
          key={step.id}
          value={currentValue}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, [step.field]: value }))
          }
        >
          <SelectTrigger className="h-14 rounded-xl text-center text-lg">
            <SelectValue placeholder="Select an option..." />
          </SelectTrigger>
          <SelectContent>
            {step.options?.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-base">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    if (step.type === 'substances') {
      return (
        <div className="w-full space-y-4">
          {substances.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border/60 bg-secondary/30 p-8 text-center">
              <FlaskConical className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-muted-foreground">
                No substances added yet
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={addSubstance}
                className="mt-4 gap-2"
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
                        Name *
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
      )
    }

    return null
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-32 top-[-8rem] h-[22rem] w-[22rem] rounded-full bg-[hsl(16_96%_58%/.16)] blur-3xl" />
        <div className="absolute right-[-8rem] top-[20%] h-[20rem] w-[20rem] rounded-full bg-[hsl(222_90%_56%/.12)] blur-3xl" />
        <div className="page-grain absolute inset-0 opacity-[0.28]" />
      </div>

      {/* Header */}
      <header className="border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate('/v3')}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Layers className="h-4 w-4" />
            <span>Create Component</span>
          </div>

          <div className="w-9" />
        </div>
        <Progress value={progress} className="h-1" />
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          {/* Step Counter */}
          <div className="mb-8 flex items-center justify-center gap-2">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => i < currentStep && setCurrentStep(i)}
                disabled={i > currentStep}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all',
                  i < currentStep
                    ? 'bg-accent text-accent-foreground cursor-pointer hover:opacity-80'
                    : i === currentStep
                      ? 'bg-foreground text-background'
                      : 'bg-secondary text-muted-foreground cursor-not-allowed'
                )}
              >
                {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
              </button>
            ))}
          </div>

          {/* Question */}
          <div className="animate-fade-up text-center">
            <h1 className="text-3xl sm:text-4xl">{step.question}</h1>
            <p className="mt-3 text-muted-foreground">{step.hint}</p>
          </div>

          {/* Input */}
          <div className="mt-10">
            {renderStepInput()}
          </div>

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-center gap-4">
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                className="gap-2"
              >
                <ChevronUp className="h-4 w-4 -rotate-90" />
                Back
              </Button>
            )}

            <Button
              type="button"
              variant="accent"
              onClick={handleNext}
              disabled={!isCurrentValid || isSubmitting}
              className="gap-2 px-8"
            >
              {isSubmitting ? (
                'Creating...'
              ) : isLastStep ? (
                <>
                  Create Component
                  <Check className="h-4 w-4" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          {/* Keyboard hint */}
          {step.type !== 'substances' && (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Press <kbd className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">Enter</kbd> to continue
            </p>
          )}

          {/* Substances count */}
          {step.type === 'substances' && substances.length > 0 && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {substances.length} substance{substances.length !== 1 ? 's' : ''} added
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
