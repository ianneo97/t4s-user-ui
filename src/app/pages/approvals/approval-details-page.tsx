import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Package,
  Layers,
  FlaskConical,
  FileText,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useWorkspace } from '@/app/contexts/workspace-context'
import {
  getCachedProductById,
  getCachedMaterialById,
  type CachedMaterial,
} from '@/infrastructure/cache/catalog-cache'
import {
  linkProductToOrderItem,
  getCachedOrders,
} from '@/infrastructure/cache/orders-cache'
import type { ApprovalRequest } from './approvals-page'

const APPROVALS_STORAGE_KEY = 't4s-demo-approvals'

export function ApprovalDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { activeWorkspace } = useWorkspace()
  const [request, setRequest] = useState<ApprovalRequest | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(APPROVALS_STORAGE_KEY)
      if (stored) {
        const approvals = JSON.parse(stored)
        const found = approvals.find((a: ApprovalRequest) => a.id === id)
        if (found) setRequest(found)
      }
    } catch (e) {
      console.error(e)
    }
  }, [id])

  const product = useMemo(() => {
    if (!request?.productId) return null
    return getCachedProductById(request.productId)
  }, [request?.productId])

  const materials = useMemo(() => {
    if (!product?.bom?.items) return []
    return product.bom.items
      .map((item) => getCachedMaterialById(item.materialId))
      .filter(Boolean) as CachedMaterial[]
  }, [product])

  const orderInfo = useMemo(() => {
    if (!request?.soId) return null
    const orders = getCachedOrders()
    const order = orders.find((o) => o.id === request.soId)
    const item = order?.items.find((i) => i.id === request.poItemId)
    return { order, item }
  }, [request])

  if (!request) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h2 className="mt-4 text-xl font-semibold">Approval Not Found</h2>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/catalog/approvals">Back to Approvals</Link>
          </Button>
        </div>
      </div>
    )
  }

  const isApprover = request.approverId === activeWorkspace.id

  const handleApprove = () => {
    if (!request) return
    try {
      // 1. Link product to PO item
      if (request.soId && request.poItemId && request.productId) {
        linkProductToOrderItem(
          request.soId,
          request.poItemId,
          request.productId
        )
      }

      // 2. Update approval status
      const stored = localStorage.getItem(APPROVALS_STORAGE_KEY)
      if (stored) {
        const approvals = JSON.parse(stored)
        const updated = approvals.map((a: ApprovalRequest) =>
          a.id === request.id ? { ...a, status: 'APPROVED' } : a
        )
        localStorage.setItem(APPROVALS_STORAGE_KEY, JSON.stringify(updated))
        setRequest({ ...request, status: 'APPROVED' })

        toast.success('Product Approved', {
          description:
            'The product has been approved and linked to your purchase order item.',
        })
      }
    } catch {
      toast.error('Failed to approve request')
    }
  }

  const handleReject = () => {
    if (!request) return
    try {
      const stored = localStorage.getItem(APPROVALS_STORAGE_KEY)
      if (stored) {
        const approvals = JSON.parse(stored)
        const updated = approvals.map((a: ApprovalRequest) =>
          a.id === request.id ? { ...a, status: 'REJECTED' } : a
        )
        localStorage.setItem(APPROVALS_STORAGE_KEY, JSON.stringify(updated))
        setRequest({ ...request, status: 'REJECTED' })

        toast.error('Product Rejected', {
          description: 'The product definition was rejected.',
        })
      }
    } catch {
      toast.error('Failed to reject request')
    }
  }

  return (
    <div className="min-h-screen pb-16">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-36 top-[-12rem] h-[30rem] w-[30rem] rounded-full bg-[hsl(var(--primary)/0.08)] blur-3xl" />
        <div className="page-grain absolute inset-0 opacity-[0.3]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/catalog/approvals')}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">Approval Request</h1>
              <Badge
                variant="secondary"
                className={
                  request.status === 'APPROVED'
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : request.status === 'REJECTED'
                      ? 'bg-red-500/10 text-red-600'
                      : 'bg-amber-500/10 text-amber-600'
                }
              >
                {request.status}
              </Badge>
            </div>
          </div>

          {isApprover && request.status === 'PENDING' && (
            <div className="flex items-center gap-3">
              <Button
                onClick={handleReject}
                variant="outline"
                className="border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-600"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve & Link Product
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Request Meta Info */}
          <div className="space-y-6 md:col-span-1">
            <div className="surface-panel rounded-2xl border border-border/50 p-6">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Request Details
              </h3>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="mb-1 text-muted-foreground">Submitted By</dt>
                  <dd className="flex items-center gap-2 font-medium">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {request.requesterName}
                  </dd>
                </div>
                <div>
                  <dt className="mb-1 text-muted-foreground">Submitted On</dt>
                  <dd className="flex items-center gap-2 font-medium">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {new Date(request.createdAt).toLocaleDateString()}
                  </dd>
                </div>
                {orderInfo?.order && (
                  <div>
                    <dt className="mb-1 text-muted-foreground">
                      Target Order Context
                    </dt>
                    <dd className="font-medium">
                      <div className="mt-1 space-y-2 rounded-lg bg-secondary/50 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Order Ref
                          </span>
                          <span className="font-mono text-xs">
                            {orderInfo.order.orderNumber}
                          </span>
                        </div>
                        {orderInfo.item && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              PO Item
                            </span>
                            <span className="font-mono text-xs">
                              {orderInfo.item.name} (Qty:{' '}
                              {orderInfo.item.quantity})
                            </span>
                          </div>
                        )}
                      </div>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Product Overview */}
          <div className="space-y-6 md:col-span-2">
            {!product ? (
              <div className="surface-subtle rounded-2xl border border-dashed border-border/60 p-12 text-center">
                <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                <h3 className="text-lg font-semibold">
                  Product Data Unavailable
                </h3>
                <p className="mt-2 text-muted-foreground">
                  The product referenced in this request could not be found.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="surface-panel rounded-2xl border border-border/50 p-6">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{product.name}</h2>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-mono">{product.upc}</span>
                        <span>•</span>
                        <span>
                          {product.categoryType} / {product.subCategory}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border/50 bg-background/50 p-4">
                      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                        <Layers className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          BOM Components
                        </span>
                      </div>
                      <p className="text-2xl font-semibold">
                        {materials.length}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-background/50 p-4">
                      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                        <FlaskConical className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Unique Substances
                        </span>
                      </div>
                      <p className="text-2xl font-semibold">
                        {
                          new Set(
                            materials.flatMap((m) =>
                              m.substances.map((s) => s.substanceCode)
                            )
                          ).size
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="surface-panel overflow-hidden rounded-2xl border border-border/50 p-0">
                  <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-6 py-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      <FileText className="h-4 w-4" /> Component Breakdown
                    </h3>
                  </div>
                  <div className="divide-y divide-border/50">
                    {materials.map((mat) => (
                      <div key={mat.id} className="p-6">
                        <div className="mb-4 flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{mat.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              Supplier:{' '}
                              {mat.substances[0]?.supplierName || 'Unknown'}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {mat.substances.length} Substances
                          </Badge>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-border/50 bg-background/50">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground">
                              <tr>
                                <th className="px-4 py-2 text-left font-medium">
                                  Substance
                                </th>
                                <th className="px-4 py-2 text-left font-medium">
                                  CAS Number
                                </th>
                                <th className="px-4 py-2 text-right font-medium">
                                  Mix (%)
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                              {mat.substances.map((sub, idx) => (
                                <tr key={idx}>
                                  <td className="px-4 py-3 font-medium">
                                    {sub.substanceName}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-muted-foreground">
                                    {sub.substanceCode}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    {sub.percentage}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
