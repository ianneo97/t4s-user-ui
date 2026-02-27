import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Eye,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useWorkspace } from '@/app/contexts/workspace-context'

export type ApprovalRequest = {
  id: string
  productId?: string
  productName: string
  sku: string
  requesterName: string
  requesterId: string
  approverId: string
  soId?: string
  poItemId?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

const APPROVALS_STORAGE_KEY = 't4s-demo-approvals'

export function ApprovalsPage() {
  const { activeWorkspace } = useWorkspace()
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(APPROVALS_STORAGE_KEY)
      if (stored) {
        setApprovals(JSON.parse(stored))
      }
    } catch (e) {
      console.error(e)
    }
  }, [activeWorkspace])

  const updateStatus = (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    const updated = approvals.map((a) =>
      a.id === id ? { ...a, status: newStatus } : a
    )
    setApprovals(updated)
    localStorage.setItem(APPROVALS_STORAGE_KEY, JSON.stringify(updated))
  }

  // Filter approvals based on current workspace
  const isBrand = activeWorkspace.type === 'BRAND'
  // If Brand, show requests they RECEIVED. If Mfg, show requests they SENT.
  const relevantApprovals = approvals.filter((a) =>
    isBrand
      ? a.approverId === activeWorkspace.id
      : a.requesterId === activeWorkspace.id
  )

  const pendingCount = relevantApprovals.filter(
    (a) => a.status === 'PENDING'
  ).length

  return (
    <div className="relative min-h-screen pb-24">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-36 top-[-12rem] h-[30rem] w-[30rem] rounded-full bg-[hsl(var(--primary)/0.08)] blur-3xl" />
        <div className="page-grain absolute inset-0 opacity-[0.3]" />
      </div>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="animate-fade-up flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Badge className="mb-4 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              Supply Chain Approvals
            </Badge>
            <h1 className="flex items-center gap-3 text-4xl leading-tight sm:text-5xl">
              <ShieldCheck className="h-10 w-10 text-primary" />
              Approvals Hub
            </h1>
            <p className="mt-2 text-muted-foreground">
              {isBrand
                ? 'Review and approve product definitions submitted by manufacturers.'
                : 'Track product approval requests sent to your brand partners.'}
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-3xl font-bold">{pendingCount}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pending
              </p>
            </div>
            <div className="h-10 w-px bg-border/50" />
            <div className="text-center">
              <p className="text-3xl font-bold">{relevantApprovals.length}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total
              </p>
            </div>
          </div>
        </div>

        <section className="animate-fade-up stagger-1 space-y-4">
          {relevantApprovals.length === 0 ? (
            <div className="surface-subtle rounded-3xl border border-dashed border-border/60 p-12 text-center">
              <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
              <h3 className="text-xl font-semibold">No Approvals Found</h3>
              <p className="mt-2 text-muted-foreground">
                {isBrand
                  ? "You don't have any pending approval requests from manufacturers."
                  : "You haven't requested any product approvals yet. Use the Product Builder to submit one."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {relevantApprovals.map((req) => (
                <div
                  key={req.id}
                  className="surface-panel flex flex-col items-start justify-between gap-6 rounded-2xl border border-border/50 p-6 shadow-sm transition-all hover:shadow-md sm:flex-row sm:items-center"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`${req.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600' : req.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'} grid h-12 w-12 shrink-0 place-items-center rounded-xl`}
                    >
                      {req.status === 'PENDING' && (
                        <Clock className="h-6 w-6" />
                      )}
                      {req.status === 'APPROVED' && (
                        <CheckCircle2 className="h-6 w-6" />
                      )}
                      {req.status === 'REJECTED' && (
                        <XCircle className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          {req.productName}
                        </h3>
                        <Badge variant="outline" className="font-mono text-xs">
                          {req.sku}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" />{' '}
                          {isBrand
                            ? `Sent to: Manufacturer`
                            : `From: ${req.requesterName}`}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex w-full items-center gap-3 sm:mt-0 sm:w-auto">
                    {req.productId ? (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Link to={`/catalog/approvals/${req.id}`}>
                          <Eye className="h-4 w-4" /> View Details
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        disabled
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        title="Legacy approval without a product ID"
                      >
                        <Eye className="h-4 w-4" /> View Details
                      </Button>
                    )}

                    {!isBrand && req.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => updateStatus(req.id, 'REJECTED')}
                          variant="outline"
                          size="sm"
                          className="border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                        >
                          Reject
                        </Button>
                        <Button
                          onClick={() => updateStatus(req.id, 'APPROVED')}
                          variant="default"
                          size="sm"
                          className="bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Approve
                        </Button>
                      </div>
                    )}

                    {req.status !== 'PENDING' && (
                      <Badge
                        variant="secondary"
                        className={
                          req.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-red-500/10 text-red-600'
                        }
                      >
                        {req.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
