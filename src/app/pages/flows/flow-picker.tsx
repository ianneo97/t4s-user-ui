import { Link } from 'react-router-dom'
import {
  Sparkles,
  ListChecks,
  MessageCircle,
  LayoutTemplate,
  ArrowRight,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const FLOW_VARIANTS = [
  {
    id: 'v1',
    name: 'Mode Picker Flow',
    description: 'Choose between Quick Add (essentials only) or Full Details (complete wizard). Best for users who know what level of detail they need.',
    icon: ListChecks,
    badge: 'Current',
    features: ['Quick Add option', 'Full wizard option', 'Post-creation prompts'],
  },
  {
    id: 'v2',
    name: 'Single Page Flow',
    description: 'All fields on one scrollable page with smart sections. No steps, no navigation - just fill what you need and submit.',
    icon: Zap,
    badge: 'Fastest',
    features: ['No wizard steps', 'Collapsible sections', 'Inline validation'],
  },
  {
    id: 'v3',
    name: 'Conversational Flow',
    description: 'One question at a time, typeform-style. Guided experience with context and tips at each step. Best for new users.',
    icon: MessageCircle,
    badge: 'Guided',
    features: ['One field at a time', 'Contextual help', 'Progress indicator'],
  },
  {
    id: 'v4',
    name: 'Template Flow',
    description: 'Start from pre-built templates for common product types. Customize only what differs. Best for repetitive entries.',
    icon: LayoutTemplate,
    badge: 'Smart',
    features: ['Pre-filled templates', 'Clone & modify', 'Batch creation'],
  },
]

export function FlowPickerPage() {
  return (
    <div className="relative min-h-screen pb-16">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-36 top-[-12rem] h-[30rem] w-[30rem] rounded-full bg-[hsl(16_96%_58%/.14)] blur-3xl" />
        <div className="absolute -right-40 top-[18%] h-[28rem] w-[28rem] rounded-full bg-[hsl(222_88%_54%/.12)] blur-3xl" />
        <div className="page-grain absolute inset-0 opacity-[0.3]" />
      </div>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
            <Sparkles className="h-8 w-8 text-accent" />
          </div>
          <h1 className="mt-6 text-3xl sm:text-4xl">UX Flow Variants</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Explore different approaches to product and component creation.
            Each variant offers a unique user experience while maintaining the same design.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {FLOW_VARIANTS.map((variant) => {
            const Icon = variant.icon
            return (
              <Link
                key={variant.id}
                to={`/${variant.id}`}
                className="group surface-panel flex flex-col rounded-3xl p-6 transition-all hover:shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <Badge variant="secondary" className="font-semibold">
                    {variant.badge}
                  </Badge>
                </div>

                <h2 className="mt-4 text-xl font-semibold">{variant.name}</h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">
                  {variant.description}
                </p>

                <ul className="mt-4 space-y-1">
                  {variant.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-accent">
                  Try this flow
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            )
          })}
        </div>

        <div className="mt-12 rounded-xl border border-border/60 bg-card/50 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Note:</span> All variants use the same
            underlying data and cache. Products/components created in one flow appear in all others.
          </p>
        </div>
      </main>
    </div>
  )
}
