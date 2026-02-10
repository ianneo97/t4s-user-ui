import { useEffect, useMemo, useState } from 'react'
import {
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
  useMsal,
} from '@azure/msal-react'
import {
  Boxes,
  CheckCircle2,
  ChevronRight,
  Layers,
  Package,
  Plus,
  Sparkles,
  Workflow,
} from 'lucide-react'
import { Link, Route, Routes } from 'react-router-dom'

import { RootLayout } from '@/app/layouts/root-layout'
import { CatalogPage } from '@/app/pages/catalog/catalog-page'
import { ComponentDetailPage } from '@/app/pages/components/component-detail'
import { ManageBOMPage } from '@/app/pages/components/manage-bom'
import { LoginPage } from '@/app/pages/login-page'
import { CreateMaterialPage } from '@/app/pages/materials/create-material'
import { CreateProductPage } from '@/app/pages/products/create-product'
import { ProductDetailPage } from '@/app/pages/products/product-detail'
import { SuppliersPage } from '@/app/pages/suppliers/suppliers-page'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getCachedProducts, getCachedMaterials } from '@/infrastructure/cache/catalog-cache'

function useDevBypass() {
  // Initialize from sessionStorage synchronously to avoid flash
  const [isDevBypass, setIsDevBypass] = useState(() => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem('devBypass') === 'true'
  })

  useEffect(() => {
    // Re-check on mount in case of SSR hydration mismatch
    const value = sessionStorage.getItem('devBypass') === 'true'
    if (value !== isDevBypass) {
      setIsDevBypass(value)
    }

    // Listen for storage changes (e.g., from login page)
    const handleStorage = () => {
      setIsDevBypass(sessionStorage.getItem('devBypass') === 'true')
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [isDevBypass])

  return isDevBypass
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="catalog/products/create" element={<CreateProductPage />} />
        <Route path="catalog/products/:productId" element={<ProductDetailPage />} />
        <Route path="catalog/products/:productId/bom" element={<ManageBOMPage />} />
        <Route path="catalog/components/create" element={<CreateMaterialPage />} />
        <Route path="catalog/components/:componentId" element={<ComponentDetailPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        {/* Legacy routes - redirect to catalog */}
        <Route path="products" element={<CatalogPage />} />
        <Route path="products/create" element={<CreateProductPage />} />
        <Route path="products/:productId/bom" element={<ManageBOMPage />} />
        <Route path="materials" element={<CatalogPage />} />
        <Route path="materials/create" element={<CreateMaterialPage />} />
      </Route>
    </Routes>
  )
}

export function AppRouter() {
  const isDevBypass = useDevBypass()

  if (isDevBypass) {
    return <AppRoutes />
  }

  return (
    <>
      <UnauthenticatedTemplate>
        <LoginPage />
      </UnauthenticatedTemplate>
      <AuthenticatedTemplate>
        <AppRoutes />
      </AuthenticatedTemplate>
    </>
  )
}

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

export function DashboardPage() {
  const { accounts } = useMsal()
  const user = accounts[0]
  const firstName = user?.name?.split(' ')[0]

  const products = useMemo(() => getCachedProducts(), [])
  const materials = useMemo(() => getCachedMaterials(), [])
  const mappedBomCount = products.filter(
    (product) => (product.bom?.items.length || 0) > 0
  ).length

  const quickActions = [
    {
      title: 'Create Product',
      description: 'Capture identity, category, and product media quickly.',
      href: '/catalog/products/create',
      icon: Package,
    },
    {
      title: 'Create Component',
      description: 'Add costed materials and reusable certificates.',
      href: '/catalog/components/create',
      icon: Layers,
    },
  ]

  return (
    <div className="relative min-h-screen pb-16">
      <ShellBackdrop />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section className="surface-panel animate-fade-up relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-10">
          <div className="absolute -right-16 top-0 h-56 w-56 rounded-full bg-[hsl(var(--accent)/0.18)] blur-3xl" />
          <div className="relative">
            <Badge className="rounded-full bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
              Operations Cockpit
            </Badge>
            <h1 className="mt-4 max-w-2xl text-4xl leading-tight sm:text-5xl">
              {firstName ? `Welcome back, ${firstName}.` : 'Traceability Hub'}
            </h1>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Build products and components in cache-first mode, then map BOMs
              with zero waiting and immediate feedback.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="accent" size="lg" className="gap-2">
                <Link to="/catalog/products/create">
                  <Plus className="h-4 w-4" />
                  New Product
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link to="/catalog/components/create">
                  <Layers className="h-4 w-4" />
                  New Component
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              label: 'Products',
              value: String(products.length),
              detail: 'Cached and ready for BOM mapping',
              icon: Package,
            },
            {
              label: 'Components',
              value: String(materials.length),
              detail: 'Material profiles available',
              icon: Layers,
            },
            {
              label: 'Mapped BOMs',
              value: String(mappedBomCount),
              detail: 'Products with component composition',
              icon: Workflow,
            },
          ].map((item, index) => {
            const Icon = item.icon
            return (
              <article
                key={item.label}
                className={cn(
                  'surface-subtle animate-fade-up rounded-2xl p-5',
                  `stagger-${index + 1}`
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="mt-3 text-4xl">{item.value}</p>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary/85">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {item.detail}
                </p>
              </article>
            )
          })}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <article className="surface-panel animate-fade-up stagger-2 rounded-3xl p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <p className="text-sm font-semibold uppercase tracking-[0.13em] text-muted-foreground">
                Quick Actions
              </p>
            </div>

            <div className="mt-4 grid gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.href}
                    to={action.href}
                    className="group flex items-start gap-4 rounded-2xl border border-border/85 bg-card/75 p-4 transition-all hover:border-foreground/25 hover:bg-card"
                  >
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-secondary/80">
                      <Icon className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-semibold">{action.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </Link>
                )
              })}
            </div>
          </article>

          <article className="surface-panel animate-fade-up stagger-3 rounded-3xl p-6">
            <div className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-accent" />
              <p className="text-sm font-semibold uppercase tracking-[0.13em] text-muted-foreground">
                Workflow Status
              </p>
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

