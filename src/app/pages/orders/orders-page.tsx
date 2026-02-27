import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  FileText,
  Building2,
  Package,
  Calendar,
  CheckCircle2,
  ShoppingCart,
  FileCheck2,
  Plus,
  Trash2,
  MapPin,
  Mail,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useWorkspace, WORKSPACES } from '@/app/contexts/workspace-context'
import {
  getCachedOrders,
  saveCachedOrders,
  type CachedOrder,
  type CachedOrderItem,
} from '@/infrastructure/cache/orders-cache'
import {
  getCachedSuppliers,
  createCachedSupplier,
  getCachedProducts,
  type CachedSupplier,
  type CachedProduct,
} from '@/infrastructure/cache/catalog-cache'

function generateId() {
  return Math.random().toString(36).substring(2, 11)
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Nested dialog for creating a supplier quickly
function AddSupplierDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (supplier: CachedSupplier) => void
}) {
  const [formData, setFormData] = useState<{
    name: string
    countryOfOrigin: string
    address: string
    contactEmail: string
    contactPhone: string
    website: string
    linkedWorkspaceId?: string
  }>({
    name: '',
    countryOfOrigin: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    linkedWorkspaceId: 'none',
  })

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Supplier name is required')
      return
    }
    if (!formData.countryOfOrigin.trim()) {
      toast.error('Country of origin is required')
      return
    }

    const dataToSave = { ...formData }
    if (dataToSave.linkedWorkspaceId === 'none') {
      dataToSave.linkedWorkspaceId = undefined
    }

    const newSupplier = createCachedSupplier(dataToSave)
    toast.success('Supplier added successfully')
    onSuccess(newSupplier)
    onOpenChange(false)
    setFormData({
      name: '',
      countryOfOrigin: '',
      address: '',
      contactEmail: '',
      contactPhone: '',
      website: '',
      linkedWorkspaceId: 'none',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Supplier</DialogTitle>
          <DialogDescription>
            Create a new supplier record to issue this purchase order to.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4">
            <label className="text-sm font-medium text-indigo-700">
              Search Platform Directory (Optional)
            </label>
            <Select
              value={formData.linkedWorkspaceId}
              onValueChange={(val) => {
                if (val === 'none') {
                  setFormData((prev) => ({
                    ...prev,
                    linkedWorkspaceId: 'none',
                  }))
                  return
                }
                const ws = WORKSPACES.find((w) => w.id === val)
                if (ws) {
                  setFormData((prev) => ({
                    ...prev,
                    name: ws.name,
                    linkedWorkspaceId: val,
                    countryOfOrigin: ws.id.includes('mfg')
                      ? 'China'
                      : 'Netherlands',
                    address: ws.id.includes('mfg')
                      ? '123 Manufacturing Blvd, Qingdao'
                      : '456 Retail Ave, Amsterdam',
                    contactEmail: `contact@${ws.name.toLowerCase().replace(/\s+/g, '')}.com`,
                    website: `https://www.${ws.name.toLowerCase().replace(/\s+/g, '')}.com`,
                  }))
                  toast.success(`Auto-filled details for ${ws.name}`)
                }
              }}
            >
              <SelectTrigger className="border-indigo-500/30 bg-white">
                <SelectValue placeholder="Search for existing platform companies..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  Manual Entry (External Supplier)
                </SelectItem>
                {WORKSPACES.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} ({w.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-indigo-600/80">
              Select an existing company on the platform to automatically
              connect and fill their details.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Supplier Name *</label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter supplier name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Country of Origin *</label>
            <Input
              value={formData.countryOfOrigin}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  countryOfOrigin: e.target.value,
                }))
              }
              placeholder="e.g., USA, China, Germany"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.contactEmail}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    contactEmail: e.target.value,
                  }))
                }
                placeholder="contact@supplier.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    contactPhone: e.target.value,
                  }))
                }
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Add Supplier</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CreateOrderDialog({
  open,
  onOpenChange,
  activeWorkspaceId,
  onOrderCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeWorkspaceId: string
  onOrderCreated: () => void
}) {
  const [suppliers, setSuppliers] = useState<CachedSupplier[]>([])
  const [products, setProducts] = useState<CachedProduct[]>([])
  const [selectedTarget, setSelectedTarget] = useState<string>('')
  const [orderNumber, setOrderNumber] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [shipToAddress, setShipToAddress] = useState('')
  const [orderNature, setOrderNature] = useState('Purchase')
  const [shippedOn, setShippedOn] = useState('')
  const [items, setItems] = useState<Partial<CachedOrderItem>[]>([
    { name: '', quantity: 0, unitPrice: 0 },
  ])
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setSuppliers(getCachedSuppliers())
      setProducts(getCachedProducts())
      setOrderNumber(
        `PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, '0')}`
      )
      setSelectedTarget('')
      setCurrency('USD')
      setShipToAddress('')
      setOrderNature('Purchase')
      setShippedOn('')
      setItems([{ name: '', quantity: 0, unitPrice: 0 }])
    }
  }, [open])

  const handleCreateOrder = () => {
    if (!selectedTarget) {
      toast.error('Please select a supplier or target brand')
      return
    }

    if (items.some((i) => !i.name || !i.quantity || !i.unitPrice)) {
      toast.error('Please complete all line items')
      return
    }

    let targetWorkspaceId = selectedTarget
    let supplierId: string | undefined = undefined
    let supplierName: string | undefined = undefined

    // For POs, the target is usually a supplier
    const supplier = suppliers.find((s) => s.id === selectedTarget)
    if (supplier) {
      supplierId = supplier.id
      supplierName = supplier.name
      // Use the linked workspace ID if the supplier is connected to one, otherwise use the supplier ID
      targetWorkspaceId = supplier.linkedWorkspaceId || supplier.id
    }

    // Always create as PO from the perspective of the creator
    const newOrder: CachedOrder = {
      id: `ord-${generateId()}`,
      orderNumber,
      type: 'PO', // Creator is ALWAYS making a PO
      workspaceId: activeWorkspaceId,
      targetWorkspaceId,
      supplierId,
      supplierName,
      currency,
      shipToAddress,
      orderNature,
      shippedOn,
      items: items.map((i) => ({
        id: `pi-${generateId()}`,
        name: i.name!,
        productId: i.productId,
        quantity: i.quantity!,
        unitPrice: i.unitPrice!,
        status: 'PENDING',
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Now we also create the counterpart Sales Order (SO) for the target workspace
    // This allows the receiving workspace to see it as a Sales Order
    const counterpartOrder: CachedOrder = {
      ...newOrder,
      id: `ord-${generateId()}`, // Different ID
      type: 'SO', // Target sees it as a Sales Order
      workspaceId: targetWorkspaceId, // It belongs to the target
      targetWorkspaceId: activeWorkspaceId, // The counterpart is the creator
      // Remove supplier ID from the receiver's perspective as they are the supplier
      supplierId: undefined,
      supplierName: undefined,
      // For simplicity in the demo, we'll keep the same item IDs so linking works easily
      items: newOrder.items.map((item) => ({ ...item })),
    }

    const allOrders = getCachedOrders()
    saveCachedOrders([...allOrders, newOrder, counterpartOrder])
    toast.success('Purchase Order created successfully')
    onOrderCreated()
    onOpenChange(false)
  }

  const selectedSupplier = suppliers.find((s) => s.id === selectedTarget)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>
              Create a new purchase order to send to a supplier or manufacturer.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Order Number *</label>
                <Input
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Supplier *</label>
                <div className="flex gap-2">
                  <Select
                    value={selectedTarget}
                    onValueChange={setSelectedTarget}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Search and select a supplier..." />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.length === 0 ? (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                          No suppliers found
                        </div>
                      ) : (
                        suppliers.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                            {s.linkedWorkspaceId ? ' (Platform Connected)' : ''}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsAddSupplierOpen(true)}
                    title="Add New Supplier"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {selectedSupplier && (
              <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-sm">
                <div className="mb-1 flex items-center gap-2 font-medium">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {selectedSupplier.name}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-muted-foreground">
                  {selectedSupplier.countryOfOrigin && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" />{' '}
                      {selectedSupplier.countryOfOrigin}
                    </div>
                  )}
                  {selectedSupplier.contactEmail && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3" />{' '}
                      {selectedSupplier.contactEmail}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Currency</label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder="USD" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="RMB">RMB (¥)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Order Nature</label>
                <Select value={orderNature} onValueChange={setOrderNature}>
                  <SelectTrigger>
                    <SelectValue placeholder="Purchase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Purchase">Purchase</SelectItem>
                    <SelectItem value="Sample">Sample</SelectItem>
                    <SelectItem value="Replacement">Replacement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Shipped On</label>
                <Input
                  type="date"
                  value={shippedOn}
                  onChange={(e) => setShippedOn(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ship To Address</label>
              <Input
                placeholder="Full delivery address"
                value={shipToAddress}
                onChange={(e) => setShipToAddress(e.target.value)}
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Line Items *</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setItems([
                      ...items,
                      { name: '', quantity: 0, unitPrice: 0 },
                    ])
                  }
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>
              </div>

              {items.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="grid flex-1 grid-cols-12 gap-2">
                    <div className="col-span-6">
                      <Select
                        value={item.productId || ''}
                        onValueChange={(val) => {
                          const newItems = [...items]
                          const selectedProduct = products.find(
                            (p) => p.id === val
                          )
                          if (selectedProduct) {
                            newItems[index].productId = selectedProduct.id
                            newItems[index].name = selectedProduct.name
                          }
                          setItems(newItems)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.length === 0 ? (
                            <div className="p-2 text-center text-sm text-muted-foreground">
                              No products found. Create products in Catalog
                              first.
                            </div>
                          ) : (
                            products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} {p.upc ? `(${p.upc})` : ''}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity || ''}
                        onChange={(e) => {
                          const newItems = [...items]
                          newItems[index].quantity = Number(e.target.value)
                          setItems(newItems)
                        }}
                      />
                    </div>
                    <div className="relative col-span-3">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-muted-foreground sm:text-sm">
                          {currency === 'USD'
                            ? '$'
                            : currency === 'EUR'
                              ? '€'
                              : currency === 'GBP'
                                ? '£'
                                : '¥'}
                        </span>
                      </div>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        className="pl-7"
                        value={item.unitPrice || ''}
                        onChange={(e) => {
                          const newItems = [...items]
                          newItems[index].unitPrice = Number(e.target.value)
                          setItems(newItems)
                        }}
                      />
                    </div>
                  </div>
                  {items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive"
                      onClick={() => {
                        const newItems = items.filter((_, i) => i !== index)
                        setItems(newItems)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrder}>Create Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddSupplierDialog
        open={isAddSupplierOpen}
        onOpenChange={setIsAddSupplierOpen}
        onSuccess={(newSupplier) => {
          setSuppliers((prev) => [...prev, newSupplier])
          setSelectedTarget(newSupplier.id)
        }}
      />
    </>
  )
}

export function OrdersPage() {
  const { activeWorkspace } = useWorkspace()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeTab, setActiveTab] = useState<'PO' | 'SO'>('PO')

  const orders = useMemo(() => {
    return getCachedOrders().filter((o) => o.workspaceId === activeWorkspace.id)
  }, [activeWorkspace.id, refreshTrigger])

  const filteredOrders = orders.filter((o) => o.type === activeTab)

  return (
    <div className="relative min-h-screen pb-24">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-36 top-[-12rem] h-[30rem] w-[30rem] rounded-full bg-[hsl(var(--primary)/0.08)] blur-3xl" />
        <div className="page-grain absolute inset-0 opacity-[0.3]" />
      </div>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="animate-fade-up flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Badge className="mb-4 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              Order Management
            </Badge>
            <h1 className="flex items-center gap-3 text-4xl leading-tight sm:text-5xl">
              <ShoppingCart className="h-10 w-10 text-primary" />
              Orders
            </h1>
            <p className="mt-2 text-muted-foreground">
              Manage your purchase orders sent to suppliers and sales orders
              received from customers.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="flex items-center gap-4 rounded-2xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm">
              <div className="px-4 text-center">
                <p className="text-3xl font-bold">{filteredOrders.length}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {activeTab === 'PO' ? 'Purchase Orders' : 'Sales Orders'}
                </p>
              </div>
            </div>
            {activeTab === 'PO' && (
              <Button
                className="rounded-xl px-5"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create PO
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border/50 pb-px">
          <button
            onClick={() => setActiveTab('PO')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'PO'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Purchase Orders
          </button>
          <button
            onClick={() => setActiveTab('SO')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'SO'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sales Orders
          </button>
        </div>

        <section className="animate-fade-up stagger-1 space-y-6">
          {filteredOrders.length === 0 ? (
            <div className="surface-subtle rounded-3xl border border-dashed border-border/60 p-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
              <h3 className="text-xl font-semibold">
                No {activeTab === 'PO' ? 'Purchase' : 'Sales'} Orders Found
              </h3>
              <p className="mt-2 text-muted-foreground">
                There are no active {activeTab === 'PO' ? 'purchase' : 'sales'}{' '}
                orders for this workspace.
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="surface-panel overflow-hidden rounded-3xl border border-border/50 shadow-sm"
              >
                {/* Order Header */}
                <div className="flex flex-col items-start justify-between gap-4 border-b border-border/50 bg-muted/30 px-6 py-5 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4">
                    <div className="grid h-12 w-12 place-items-center rounded-xl border border-border/50 bg-background shadow-sm">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-mono text-xl font-semibold">
                          {order.orderNumber}
                        </h2>
                        <Badge variant="outline">{order.type}</Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {order.supplierName && (
                          <span className="flex items-center gap-1.5 text-primary">
                            <Building2 className="h-3.5 w-3.5" />
                            {order.supplierName}
                          </span>
                        )}
                        {!order.supplierName && (
                          <span className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5" />
                            Partner ID: {order.targetWorkspaceId}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(order.createdAt)}
                        </span>
                        {order.currency && (
                          <span className="flex items-center gap-1.5">
                            <Badge variant="secondary" className="px-1.5 py-0">
                              {order.currency}
                            </Badge>
                          </span>
                        )}
                      </div>
                      {(order.shipToAddress || order.shippedOn) && (
                        <div className="mt-2 flex flex-wrap items-center gap-4 border-t border-border/30 pt-2 text-sm text-muted-foreground">
                          {order.shipToAddress && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              <span className="line-clamp-1">
                                {order.shipToAddress}
                              </span>
                            </span>
                          )}
                          {order.shippedOn && (
                            <span className="flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5" />
                              Shipped:{' '}
                              {new Date(order.shippedOn).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/orders/${order.id}`}>View Details</Link>
                  </Button>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Line Items
                  </h3>
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col justify-between gap-4 rounded-xl border border-border/50 bg-background/50 p-4 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center"
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
                                  item.status === 'LINKED'
                                    ? 'default'
                                    : 'secondary'
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
                                      : order.currency === 'RMB'
                                        ? '¥'
                                        : '$'}
                                {item.unitPrice.toFixed(2)}
                              </span>
                              <span>•</span>
                              <span className="font-mono text-xs">
                                ID: {item.id}
                              </span>
                            </div>
                          </div>
                        </div>

                        {item.status === 'LINKED' && item.productId && (
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="shrink-0 gap-2"
                          >
                            <Link to={`/catalog/products/${item.productId}`}>
                              <FileCheck2 className="h-4 w-4 text-emerald-600" />
                              View Linked Product
                            </Link>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      <CreateOrderDialog
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        activeWorkspaceId={activeWorkspace.id}
        onOrderCreated={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </div>
  )
}
