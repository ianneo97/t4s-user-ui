import { useMemo } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { CheckCircle2, Layers, Package, Workflow } from 'lucide-react'
import {
  getCachedProducts,
  getCachedMaterials,
} from '@/infrastructure/cache/catalog-cache'
import { useWorkspace } from '@/app/contexts/workspace-context'
import { cn } from '@/lib/utils'

function ShellBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -left-36 top-[-12rem] h-[30rem] w-[30rem] rounded-full bg-[hsl(16_96%_58%/.14)] blur-3xl" />
      <div className="absolute -right-40 top-[18%] h-[28rem] w-[28rem] rounded-full bg-[hsl(222_88%_54%/.12)] blur-3xl" />
      <div className="absolute bottom-[-11rem] left-[24%] h-[26rem] w-[26rem] rounded-full bg-[hsl(184_85%_44%/.1)] blur-3xl" />
      <div className="page-grain absolute inset-0 opacity-[0.3]" />
    </div>
  )
}

function useVariantPrefix() {
  const location = useLocation()
  const match = location.pathname.match(/^\/(v[1-4])/)
  return match ? match[1] : ''
}

export function DashboardPage() {
  const variantPrefix = useVariantPrefix()
  const basePath = variantPrefix ? `/${variantPrefix}` : ''
  const { activeWorkspace } = useWorkspace()

  const products = useMemo(() => {
    return getCachedProducts().filter(
      (p) => !p.workspaceId || p.workspaceId === activeWorkspace.id
    )
  }, [activeWorkspace.id])

  const materials = useMemo(() => {
    return getCachedMaterials().filter(
      (m) => !m.workspaceId || m.workspaceId === activeWorkspace.id
    )
  }, [activeWorkspace.id])

  const mappedBomCount = products.filter(
    (product) => (product.bom?.items.length || 0) > 0
  ).length

  const quickActions = [
    {
      title: 'Create Product',
      description: 'Capture identity, category, and product media quickly.',
      href: `${basePath}/catalog/products/builder`,
      icon: Package,
    },
    {
      title: 'Product Builder',
      description: 'Unified builder for complex product definitions.',
      href: `${basePath}/catalog/products/builder`,
      icon: Workflow,
    },
    {
      title: 'Create Component',
      description: 'Add costed materials and reusable certificates.',
      href: `${basePath}/catalog/components/create`,
      icon: Layers,
    },
  ]

  return (
    <div className="relative min-h-screen pb-16">
      <ShellBackdrop />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <header className="animate-fade-up mb-10">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Welcome to the Network
          </h1>
          <p className="mt-2 max-w-2xl text-lg text-muted-foreground">
            Manage your digital product passports and supply chain transparency.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold tracking-tight">
              Quick Actions
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quickActions.map((action, i) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.title}
                    to={action.href}
                    className={cn(
                      'group relative overflow-hidden rounded-2xl border border-border/50 bg-background/50 p-6',
                      'transition-all hover:-translate-y-1 hover:shadow-lg',
                      'animate-fade-up'
                    )}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="mb-4 inline-flex rounded-xl bg-accent/10 p-3 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold">{action.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </Link>
                )
              })}
            </div>
          </div>

          <article className="animate-fade-up rounded-3xl border border-border/60 bg-secondary/20 p-6 backdrop-blur-xl">
            <h2 className="text-lg font-semibold tracking-tight">
              Completion Status
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              To fully test the product builder flow, try to complete the
              following:
            </p>

            <div className="mt-8 flex items-center justify-between">
              <span className="text-4xl font-bold tracking-tight">
                {products.length > 0 &&
                materials.length > 0 &&
                mappedBomCount > 0
                  ? '100'
                  : mappedBomCount > 0
                    ? '66'
                    : products.length > 0 || materials.length > 0
                      ? '33'
                      : '0'}
                %
              </span>
              <div className="h-12 w-12 rounded-full border-[4px] border-accent/20" />
            </div>
            <div className="mt-5 space-y-3">
              {[
                {
                  label: 'At least one product created',
                  done: products.length > 0,
                },
                {
                  label: 'At least one component created',
                  done: materials.length > 0,
                },
                {
                  label: 'At least one BOM mapped',
                  done: mappedBomCount > 0,
                },
              ].map((task) => (
                <div
                  key={task.label}
                  className="flex items-center gap-3 rounded-xl border border-border/85 bg-card/75 px-4 py-3"
                >
                  <CheckCircle2
                    className={cn(
                      'h-5 w-5',
                      task.done
                        ? 'text-emerald-500'
                        : 'text-muted-foreground/60'
                    )}
                  />
                  <p
                    className={cn(
                      'text-sm font-medium',
                      task.done ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {task.label}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}
