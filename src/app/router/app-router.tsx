import { Navigate, Route, Routes } from 'react-router-dom'

import { RootLayout } from '@/app/layouts/root-layout'
import { CatalogPage } from '@/app/pages/catalog/catalog-page'
import { ComponentDetailPage } from '@/app/pages/components/component-detail'
import { ManageBOMPage } from '@/app/pages/components/manage-bom'
import { CreateMaterialPage } from '@/app/pages/materials/create-material'
import { CreateProductPage } from '@/app/pages/products/create-product'
import { ProductBuilderPage } from '@/app/pages/products/builder'
import { ProductDetailPage } from '@/app/pages/products/product-detail'
import { SuppliersPage } from '@/app/pages/suppliers/suppliers-page'
import { FlowPickerPage } from '@/app/pages/flows/flow-picker'
import { CreateProductV2Page } from '@/app/pages/flows/v2/create-product-v2'
import { CreateComponentV2Page } from '@/app/pages/flows/v2/create-component-v2'
import { CreateProductV3Page } from '@/app/pages/flows/v3/create-product-v3'
import { CreateComponentV3Page } from '@/app/pages/flows/v3/create-component-v3'
import { CreateProductV4Page } from '@/app/pages/flows/v4/create-product-v4'
import { CreateComponentV4Page } from '@/app/pages/flows/v4/create-component-v4'

import { ApprovalsPage } from '@/app/pages/approvals/approvals-page'
import { ApprovalDetailsPage } from '@/app/pages/approvals/approval-details-page'
import { OrdersPage } from '@/app/pages/orders/orders-page'
import { OrderDetailsPage } from '@/app/pages/orders/order-details-page'
import { DashboardPage } from '@/app/pages/dashboard/dashboard-page'
import { WorkspaceProvider } from '@/app/contexts/workspace-context'

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
        <Route
          path="catalog/products/builder"
          element={<ProductBuilderPage />}
        />
        <Route
          path="catalog/products/:productId"
          element={<ProductDetailPage />}
        />
        <Route
          path="catalog/products/:productId/bom"
          element={<ManageBOMPage />}
        />
        <Route
          path="catalog/components/create"
          element={<CreateMaterialPage />}
        />
        <Route
          path="catalog/components/:componentId"
          element={<ComponentDetailPage />}
        />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="approvals" element={<ApprovalsPage />} />
        <Route path="approvals/:id" element={<ApprovalDetailsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailsPage />} />
      </Route>

      {/* V2 - Single Page flow */}
      <Route path="v2" element={<RootLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route
          path="catalog/products/create"
          element={<CreateProductV2Page />}
        />
        <Route
          path="catalog/products/builder"
          element={<ProductBuilderPage />}
        />
        <Route
          path="catalog/products/:productId"
          element={<ProductDetailPage />}
        />
        <Route
          path="catalog/products/:productId/bom"
          element={<ManageBOMPage />}
        />
        <Route
          path="catalog/components/create"
          element={<CreateComponentV2Page />}
        />
        <Route
          path="catalog/components/:componentId"
          element={<ComponentDetailPage />}
        />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="approvals" element={<ApprovalsPage />} />
        <Route path="approvals/:id" element={<ApprovalDetailsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailsPage />} />
      </Route>

      {/* V3 - Conversational flow */}
      <Route path="v3" element={<RootLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route
          path="catalog/products/create"
          element={<CreateProductV3Page />}
        />
        <Route
          path="catalog/products/builder"
          element={<ProductBuilderPage />}
        />
        <Route
          path="catalog/products/:productId"
          element={<ProductDetailPage />}
        />
        <Route
          path="catalog/products/:productId/bom"
          element={<ManageBOMPage />}
        />
        <Route
          path="catalog/components/create"
          element={<CreateComponentV3Page />}
        />
        <Route
          path="catalog/components/:componentId"
          element={<ComponentDetailPage />}
        />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="approvals" element={<ApprovalsPage />} />
        <Route path="approvals/:id" element={<ApprovalDetailsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailsPage />} />
      </Route>

      {/* V4 - Template flow */}
      <Route path="v4" element={<RootLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route
          path="catalog/products/create"
          element={<CreateProductV4Page />}
        />
        <Route
          path="catalog/products/builder"
          element={<ProductBuilderPage />}
        />
        <Route
          path="catalog/products/:productId"
          element={<ProductDetailPage />}
        />
        <Route
          path="catalog/products/:productId/bom"
          element={<ManageBOMPage />}
        />
        <Route
          path="catalog/components/create"
          element={<CreateComponentV4Page />}
        />
        <Route
          path="catalog/components/:componentId"
          element={<ComponentDetailPage />}
        />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="approvals" element={<ApprovalsPage />} />
        <Route path="approvals/:id" element={<ApprovalDetailsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailsPage />} />
      </Route>

      {/* Default routes (same as V1) */}
      <Route element={<RootLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="catalog/products/create" element={<CreateProductPage />} />
        <Route
          path="catalog/products/builder"
          element={<ProductBuilderPage />}
        />
        <Route
          path="catalog/products/:productId"
          element={<ProductDetailPage />}
        />
        <Route
          path="catalog/products/:productId/bom"
          element={<ManageBOMPage />}
        />
        <Route
          path="catalog/components/create"
          element={<CreateMaterialPage />}
        />
        <Route
          path="catalog/components/:componentId"
          element={<ComponentDetailPage />}
        />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="approvals" element={<ApprovalsPage />} />
        <Route path="approvals/:id" element={<ApprovalDetailsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailsPage />} />

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
  return (
    <WorkspaceProvider>
      <AppRoutes />
    </WorkspaceProvider>
  )
}
