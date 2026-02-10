import * as React from 'react'
import { useCallback, useMemo, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { FormProvider } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

export interface CreationStep {
  id: string
  title: string
  description?: string
  content: React.ReactNode
  validate?: () => Promise<boolean> | boolean
}

interface CreationFlowProps {
  title: string
  subtitle?: string
  steps: CreationStep[]
  form: UseFormReturn<any>
  onSubmit: (data: any) => Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
  submitLabel?: string
  backPath?: string
  sidebarPanel?: React.ReactNode
  hasDraft?: boolean
  onSaveDraft?: () => void
  onDiscardDraft?: () => void
}

export function CreationFlow({
  title,
  subtitle,
  steps,
  form,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Create',
  backPath = '/',
  sidebarPanel,
  hasDraft = false,
  onSaveDraft,
  onDiscardDraft,
}: CreationFlowProps) {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [isValidating, setIsValidating] = useState(false)

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1
  const progressPercentage = ((currentStep + 1) / steps.length) * 100

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel()
    } else {
      navigate(backPath)
    }
  }, [navigate, onCancel, backPath])

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  const handleNext = useCallback(async () => {
    const step = steps[currentStep]

    if (step.validate) {
      setIsValidating(true)
      try {
        const isValid = await step.validate()
        if (!isValid) {
          setIsValidating(false)
          return
        }
      } catch {
        setIsValidating(false)
        return
      }
      setIsValidating(false)
    }

    setCompletedSteps((prev) => {
      const next = new Set(prev)
      next.add(currentStep)
      return next
    })

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }, [currentStep, steps])

  const handleStepClick = useCallback(
    (index: number) => {
      if (index <= currentStep || completedSteps.has(index - 1)) {
        setCurrentStep(index)
      }
    },
    [completedSteps, currentStep]
  )

  const handleSubmit = useCallback(async () => {
    const step = steps[currentStep]

    if (step.validate) {
      setIsValidating(true)
      try {
        const isValid = await step.validate()
        if (!isValid) {
          setIsValidating(false)
          return
        }
      } catch {
        setIsValidating(false)
        return
      }
      setIsValidating(false)
    }

    form.handleSubmit(onSubmit)()
  }, [currentStep, steps, form, onSubmit])

  const currentStepData = useMemo(() => steps[currentStep], [steps, currentStep])

  return (
    <FormProvider {...form}>
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
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCancel}
                  className="h-10 w-10 rounded-xl"
                >
                  <X className="h-4 w-4" />
                </Button>

                <div>
                  <h1 className="truncate text-xl">{title}</h1>
                  {subtitle && (
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                  )}
                </div>
              </div>

              <p className="rounded-full bg-secondary/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Step {currentStep + 1} / {steps.length}
              </p>
            </div>

            <div className="mt-3">
              <Progress value={progressPercentage} />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
            <aside className="hidden lg:block">
              <div className="sticky top-28 space-y-4">
                <nav className="surface-subtle rounded-3xl p-4">
                  <div className="space-y-2">
                    {steps.map((step, index) => {
                      const isActive = index === currentStep
                      const isCompleted = completedSteps.has(index)
                      const isAccessible =
                        index <= currentStep || completedSteps.has(index - 1)

                      return (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => handleStepClick(index)}
                          disabled={!isAccessible}
                          className={cn(
                            'group w-full rounded-2xl border p-3 text-left transition-all',
                            isActive
                              ? 'border-primary/30 bg-primary/8'
                              : 'border-transparent hover:border-border/90 hover:bg-card/70',
                            !isAccessible && 'cursor-not-allowed opacity-40'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={cn(
                                'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-semibold',
                                isCompleted &&
                                  'border-accent bg-accent text-accent-foreground',
                                isActive &&
                                  !isCompleted &&
                                  'border-primary bg-primary text-primary-foreground',
                                !isActive &&
                                  !isCompleted &&
                                  'border-border text-muted-foreground'
                              )}
                            >
                              {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                            </span>

                            <div>
                              <p
                                className={cn(
                                  'text-sm font-semibold',
                                  isActive
                                    ? 'text-foreground'
                                    : 'text-muted-foreground'
                                )}
                              >
                                {step.title}
                              </p>
                              {step.description && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {step.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </nav>

                {sidebarPanel && (
                  <aside className="surface-subtle rounded-3xl p-4">
                    {sidebarPanel}
                  </aside>
                )}
              </div>
            </aside>

            <section className="min-w-0">
              <div className="mb-5 flex gap-2 lg:hidden">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      'h-1.5 flex-1 rounded-full transition-colors',
                      index <= currentStep ? 'bg-primary' : 'bg-border'
                    )}
                  />
                ))}
              </div>

              <div className="surface-panel rounded-3xl p-5 sm:p-7 lg:p-9">
                <div className="animate-fade-up">
                  <h2 className="text-3xl sm:text-4xl">{currentStepData.title}</h2>
                  {currentStepData.description && (
                    <p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
                      {currentStepData.description}
                    </p>
                  )}
                </div>

                <div className="animate-fade-up stagger-1 mt-7">
                  {currentStepData.content}
                </div>
              </div>
            </section>
          </div>
        </main>

        <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/65 bg-background/82 backdrop-blur-xl">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Button
              type="button"
              variant="ghost"
              onClick={handlePrevious}
              disabled={isFirstStep || isSubmitting}
              className={cn('gap-2', isFirstStep && 'invisible')}
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2 sm:gap-3">
              {onSaveDraft && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onSaveDraft}
                  disabled={isSubmitting}
                  className="hidden sm:inline-flex"
                >
                  Save Draft
                </Button>
              )}

              {onDiscardDraft && hasDraft && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onDiscardDraft}
                  disabled={isSubmitting}
                >
                  Clear Draft
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              {isLastStep ? (
                <Button
                  type="button"
                  variant="accent"
                  onClick={handleSubmit}
                  disabled={isSubmitting || isValidating}
                  className="min-w-[140px] gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size="sm" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {submitLabel}
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isValidating}
                  className="min-w-[120px] gap-2"
                >
                  {isValidating ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </footer>
      </div>
    </FormProvider>
  )
}
