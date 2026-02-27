import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Package,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useWorkspace } from '@/app/contexts/workspace-context'
import {
  getCachedOrders,
  type CachedOrder,
} from '@/infrastructure/cache/orders-cache'
import {
  getCachedProducts,
  type CachedProduct,
} from '@/infrastructure/cache/catalog-cache'

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { activeWorkspace } = useWorkspace()
  const [order, setOrder] = useState<CachedOrder | null>(null)
  const [products, setProducts] = useState<CachedProduct[]>([])

  useEffect(() => {
    const allOrders = getCachedOrders()
    const foundOrder = allOrders.find(
      (o) => o.id === id && o.workspaceId === activeWorkspace.id
    )
    setOrder(foundOrder || null)
    setProducts(getCachedProducts())
  }, [id, activeWorkspace.id])

  if (!order) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-muted p-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold">Order Not Found</h2>
          <p className="text-sm text-muted-foreground">
            The order you are looking for does not exist or you do not have
            access to it.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/orders')}>
          Back to Orders
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-4 text-muted-foreground"
          onClick={() => navigate('/orders')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {order.orderNumber}
              </h1>
              <Badge variant="outline" className="text-sm">
                {order.type === 'PO' ? 'Purchase Order' : 'Sales Order'}
              </Badge>
            </div>
            <p className="mt-1 text-muted-foreground">
              Created on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Order Details Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Partner Info */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {order.type === 'PO' ? 'Supplier Details' : 'Customer Details'}
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">
                  {order.supplierName ||
                    `Workspace ID: ${order.targetWorkspaceId}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.type === 'PO' ? 'Vendor' : 'Buyer'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping & Payment Info */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Order Information
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Currency</p>
              <p className="font-medium">{order.currency || 'USD'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nature</p>
              <p className="font-medium">{order.orderNature || 'Purchase'}</p>
            </div>
            {order.shippedOn && (
              <div>
                <p className="text-xs text-muted-foreground">Shipped On</p>
                <p className="font-medium">{formatDate(order.shippedOn)}</p>
              </div>
            )}
            {order.shipToAddress && (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">Ship To</p>
                <p className="font-medium">{order.shipToAddress}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Line Items</h3>
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="divide-y divide-border/50">
            {order.items.map((item) => {
              const linkedProduct = item.productId
                ? products.find((p) => p.id === item.productId)
                : null

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {item.status === 'LINKED' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground/40" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{item.name}</h4>
                        <Badge
                          variant={
                            item.status === 'LINKED' ? 'default' : 'secondary'
                          }
                          className={
                            item.status === 'LINKED'
                              ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                              : ''
                          }
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                        <span>Qty: {item.quantity.toLocaleString()}</span>
                        <span>•</span>
                        <span>
                          Unit Price:{' '}
                          {order.currency === 'USD'
                            ? '$'
                            : order.currency === 'EUR'
                              ? '€'
                              : order.currency === 'GBP'
                                ? '£'
                                : '¥'}
                          {item.unitPrice.toFixed(2)}
                        </span>
                        <span>•</span>
                        <span className="font-medium text-foreground">
                          Total:{' '}
                          {order.currency === 'USD'
                            ? '$'
                            : order.currency === 'EUR'
                              ? '€'
                              : order.currency === 'GBP'
                                ? '£'
                                : '¥'}
                          {(item.quantity * item.unitPrice).toFixed(2)}
                        </span>
                      </div>

                      {/* Product Link Information */}
                      {linkedProduct && (
                        <div className="mt-3 flex items-center gap-2 rounded-md bg-muted/50 p-2 text-sm">
                          <span className="text-muted-foreground">
                            Linked Product:
                          </span>
                          <Link
                            to={`/catalog/products/${linkedProduct.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {linkedProduct.name}{' '}
                            {linkedProduct.upc ? `(${linkedProduct.upc})` : ''}
                          </Link>
                        </div>
                      )}
                      {!linkedProduct && item.productId && (
                        <div className="mt-3 text-sm text-muted-foreground">
                          Linked to product ID: {item.productId} (Product not
                          found in current workspace)
                        </div>
                      )}
                    </div>
                  </div>

                  {order.type === 'SO' && item.status === 'PENDING' && (
                    <div className="mt-4 sm:mt-0">
                      <Button asChild size="sm">
                        <Link
                          to={`/catalog/products/builder?soId=${order.id}&poItemId=${item.id}&itemName=${encodeURIComponent(item.name)}`}
                        >
                          Create Product & Request Approval
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
