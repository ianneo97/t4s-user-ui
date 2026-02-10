import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Package,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronUp,
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
import { createCachedProduct } from '@/infrastructure/cache/catalog-cache'
import { cn } from '@/lib/utils'

const CATEGORY_TYPES = ['Apparel', 'Footwear', 'Accessories', 'Custom']
const SUB_CATEGORIES: Record<string, string[]> = {
  Apparel: ['T-Shirts', 'Pants', 'Jackets', 'Dresses', 'Sweaters'],
  Footwear: ['Sneakers', 'Boots', 'Sandals', 'Formal'],
  Accessories: ['Bags', 'Belts', 'Hats', 'Jewelry'],
  Custom: ['Custom Category'],
}

interface StepConfig {
  id: string
  question: string
  hint: string
  field: 'name' | 'upc' | 'categoryType' | 'subCategory'
  type: 'text' | 'select'
  placeholder?: string
  options?: string[]
  dependsOn?: string
}

const STEPS: StepConfig[] = [
  {
    id: 'name',
    question: "What's your product called?",
    hint: 'Give it a clear, descriptive name that helps identify it.',
    field: 'name',
    type: 'text',
    placeholder: 'e.g., Classic Cotton T-Shirt',
  },
  {
    id: 'upc',
    question: "What's the barcode?",
    hint: 'Enter the EAN or UPC barcode for this product.',
    field: 'upc',
    type: 'text',
    placeholder: 'e.g., 5901234123457',
  },
  {
    id: 'categoryType',
    question: 'Which category fits best?',
    hint: 'This helps organize your catalog and enables filtering.',
    field: 'categoryType',
    type: 'select',
    options: CATEGORY_TYPES,
  },
  {
    id: 'subCategory',
    question: 'And the sub-category?',
    hint: 'Be specific to make searching easier later.',
    field: 'subCategory',
    type: 'select',
    dependsOn: 'categoryType',
  },
]

interface FormData {
  name: string
  upc: string
  categoryType: string
  subCategory: string
}

export function CreateProductV3Page() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    upc: '',
    categoryType: '',
    subCategory: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const step = STEPS[currentStep]
  const progress = ((currentStep + 1) / STEPS.length) * 100
  const isLastStep = currentStep === STEPS.length - 1

  const currentValue = formData[step.field]
  const isCurrentValid = currentValue.trim().length > 0

  const getOptions = useMemo(() => {
    if (step.dependsOn === 'categoryType') {
      return SUB_CATEGORIES[formData.categoryType] || []
    }
    return step.options || []
  }, [step, formData.categoryType])

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
      if (e.key === 'Enter' && isCurrentValid) {
        e.preventDefault()
        handleNext()
      }
    },
    [isCurrentValid, handleNext]
  )

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const created = createCachedProduct({
        name: formData.name,
        upc: formData.upc,
        categoryType: formData.categoryType,
        subCategory: formData.subCategory,
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

      toast.success(`"${created.name}" created!`, {
        action: {
          label: 'Add BOM',
          onClick: () => navigate(`/v3/catalog/products/${created.id}/bom`),
        },
      })
      navigate('/v3/catalog')
    } catch (error) {
      console.error('Failed to create product:', error)
      toast.error('Unable to create product. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
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
            <Package className="h-4 w-4" />
            <span>Create Product</span>
          </div>

          <div className="w-9" /> {/* Spacer for centering */}
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
            {step.type === 'text' ? (
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
            ) : (
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
                  {getOptions.map((option) => (
                    <SelectItem key={option} value={option} className="text-base">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
                  Create Product
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
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Press <kbd className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">Enter</kbd> to continue
          </p>
        </div>
      </main>
    </div>
  )
}
