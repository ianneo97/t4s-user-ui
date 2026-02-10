import { useMemo } from 'react'
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
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { RootLayout } from '@/app/layouts/root-layout'
import { CatalogPage } from '@/app/pages/catalog/catalog-page'
import { ComponentDetailPage } from '@/app/pages/components/component-detail'
import { ManageBOMPage } from '@/app/pages/components/manage-bom'
import { CreateMaterialPage } from '@/app/pages/materials/create-material'
import { CreateProductPage } from '@/app/pages/products/create-product'
import { ProductDetailPage } from '@/app/pages/products/product-detail'
import { SuppliersPage } from '@/app/pages/suppliers/suppliers-page'
import { FlowPickerPage } from '@/app/pages/flows/flow-picker'
import { CreateProductV2Page } from '@/app/pages/flows/v2/create-product-v2'
import { CreateComponentV2Page } from '@/app/pages/flows/v2/create-component-v2'
import { CreateProductV3Page } from '@/app/pages/flows/v3/create-product-v3'
import { CreateComponentV3Page } from '@/app/pages/flows/v3/create-component-v3'
import { CreateProductV4Page } from '@/app/pages/flows/v4/create-product-v4'
import { CreateComponentV4Page } from '@/app/pages/flows/v4/create-component-v4'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getCachedProducts, getCachedMaterials } from '@/infrastructure/cache/catalog-cache'

function AppRoutes() {
  return (
    <Routes>
      {/* Redirect root to flows page */}
      <Route path="/" element={<Navigate to="/flows" replace />} />

      {/* Flow Picker - entry point for comparing variants */}
      <Route path="flows" element={<FlowPickerPage />} />

      {/* V1 - Current flow (Mode Picker) */}
      <Route path="v1" element={<RootLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="catalog/products/create" element={<CreateProductPage />} />
        <Route path="catalog/products/:productId" element={<ProductDetailPage />} />
        <Route path="catalog/products/:productId/bom" element={<ManageBOMPage />} />
        <Route path="catalog/components/create" element={<CreateMaterialPage />} />
        <Route path="catalog/components/:componentId" element={<ComponentDetailPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
      </Route>

      {/* V2 - Single Page flow */}
      <Route path="v2" element={<RootLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="catalog/products/create" element={<CreateProductV2Page />} />
        <Route path="catalog/products/:productId" element={<ProductDetailPage />} />
        <Route path="catalog/products/:productId/bom" element={<ManageBOMPage />} />
        <Route path="catalog/components/create" element={<CreateComponentV2Page />} />
        <Route path="catalog/components/:componentId" element={<ComponentDetailPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
      </Route>

      {/* V3 - Conversational flow */}
      <Route path="v3" element={<RootLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="catalog/products/create" element={<CreateProductV3Page />} />
        <Route path="catalog/products/:productId" element={<ProductDetailPage />} />
        <Route path="catalog/products/:productId/bom" element={<ManageBOMPage />} />
        <Route path="catalog/components/create" element={<CreateComponentV3Page />} />
        <Route path="catalog/components/:componentId" element={<ComponentDetailPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
      </Route>

      {/* V4 - Template flow */}
      <Route path="v4" element={<RootLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="catalog/products/create" element={<CreateProductV4Page />} />
        <Route path="catalog/products/:productId" element={<ProductDetailPage />} />
        <Route path="catalog/products/:productId/bom" element={<ManageBOMPage />} />
        <Route path="catalog/components/create" element={<CreateComponentV4Page />} />
        <Route path="catalog/components/:componentId" element={<ComponentDetailPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
      </Route>

      {/* Default routes (same as V1) */}
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
  // Auth disabled - go directly to app
  return <AppRoutes />
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

// Hook to get the current variant prefix (v1, v2, v3, v4, or empty)
function useVariantPrefix() {
  const location = useLocation()
  const match = location.pathname.match(/^\/(v[1-4])/)
  return match ? match[1] : ''
}

export function DashboardPage() {
  const variantPrefix = useVariantPrefix()
  const basePath = variantPrefix ? `/${variantPrefix}` : ''

  const products = useMemo(() => getCachedProducts(), [])
  const materials = useMemo(() => getCachedMaterials(), [])
  const mappedBomCount = products.filter(
    (product) => (product.bom?.items.length || 0) > 0
  ).length

  const quickActions = [
    {
      title: 'Create Product',
      description: 'Capture identity, category, and product media quickly.',
      href: `${basePath}/catalog/products/create`,
      icon: Package,
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
        <section className="surface-panel animate-fade-up relative overflow-hidden rounded-3xl p-6 sm:p-8 lg:p-10">
          <div className="absolute -right-16 top-0 h-56 w-56 rounded-full bg-[hsl(var(--accent)/0.18)] blur-3xl" />
          <div className="relative">
            <Badge className="rounded-full bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
              Operations Cockpit
            </Badge>
            <h1 className="mt-4 max-w-2xl text-4xl leading-tight sm:text-5xl">
              Traceability Hub
            </h1>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Build products and components in cache-first mode, then map BOMs
              with zero waiting and immediate feedback.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="accent" size="lg" className="gap-2">
                <Link to={`${basePath}/catalog/products/create`}>
                  <Plus className="h-4 w-4" />
                  New Product
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link to={`${basePath}/catalog/components/create`}>
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

