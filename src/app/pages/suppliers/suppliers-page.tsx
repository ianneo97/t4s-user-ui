import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertTriangle,
  Building2,
  Edit3,
  Globe,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  getCachedSuppliers,
  createCachedSupplier,
  updateCachedSupplier,
  deleteCachedSupplier,
  type CachedSupplier,
  type CreateCachedSupplierInput,
} from '@/infrastructure/cache/catalog-cache'

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

interface SupplierFormData {
  name: string
  countryOfOrigin: string
  address?: string
  contactEmail?: string
  contactPhone?: string
  website?: string
  notes?: string
}

function SupplierDialog({
  open,
  onOpenChange,
  supplier,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier: CachedSupplier | null
  onSave: (data: SupplierFormData) => void
}) {
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    countryOfOrigin: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    notes: '',
  })

  useEffect(() => {
    if (open && supplier) {
      setFormData({
        name: supplier.name,
        countryOfOrigin: supplier.countryOfOrigin,
        address: supplier.address || '',
        contactEmail: supplier.contactEmail || '',
        contactPhone: supplier.contactPhone || '',
        website: supplier.website || '',
        notes: supplier.notes || '',
      })
    } else if (open) {
      setFormData({
        name: '',
        countryOfOrigin: '',
        address: '',
        contactEmail: '',
        contactPhone: '',
        website: '',
        notes: '',
      })
    }
  }, [open, supplier])

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Supplier name is required')
      return
    }
    if (!formData.countryOfOrigin.trim()) {
      toast.error('Country of origin is required')
      return
    }
    onSave(formData)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{supplier ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
          <DialogDescription>
            {supplier ? 'Update supplier information' : 'Add a new supplier to your network'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Supplier Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter supplier name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Country of Origin *</label>
            <Input
              value={formData.countryOfOrigin}
              onChange={(e) => setFormData((prev) => ({ ...prev, countryOfOrigin: e.target.value }))}
              placeholder="e.g., Germany, USA, China"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <Textarea
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="Full address"
              rows={2}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))}
                placeholder="contact@supplier.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))}
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Website</label>
            <Input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
              placeholder="https://supplier.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this supplier"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{supplier ? 'Save Changes' : 'Add Supplier'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SupplierCard({
  supplier,
  onEdit,
  onDelete,
}: {
  supplier: CachedSupplier
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="group rounded-2xl border border-border/60 bg-card/60 p-5 transition-all hover:border-border hover:bg-card hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>

          <div className="min-w-0">
            <h3 className="font-semibold">{supplier.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                <MapPin className="mr-1 h-3 w-3" />
                {supplier.countryOfOrigin}
              </Badge>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit3 className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {(supplier.address || supplier.contactEmail || supplier.contactPhone || supplier.website) && (
        <div className="mt-4 space-y-2 border-t border-border/50 pt-4">
          {supplier.address && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-2">{supplier.address}</span>
            </div>
          )}
          {supplier.contactEmail && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <a href={`mailto:${supplier.contactEmail}`} className="hover:text-foreground">
                {supplier.contactEmail}
              </a>
            </div>
          )}
          {supplier.contactPhone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <a href={`tel:${supplier.contactPhone}`} className="hover:text-foreground">
                {supplier.contactPhone}
              </a>
            </div>
          )}
          {supplier.website && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-3.5 w-3.5 shrink-0" />
              <a
                href={supplier.website}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate hover:text-foreground"
              >
                {supplier.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>Created {formatDate(supplier.createdAt)}</span>
        <span>Updated {formatDate(supplier.updatedAt)}</span>
      </div>
    </div>
  )
}

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<CachedSupplier[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<CachedSupplier | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    setSuppliers(getCachedSuppliers())
  }, [])

  const filteredSuppliers = useMemo(() => {
    if (!searchQuery.trim()) return suppliers

    const query = searchQuery.toLowerCase()
    return suppliers.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(query) ||
        supplier.countryOfOrigin.toLowerCase().includes(query) ||
        supplier.address?.toLowerCase().includes(query) ||
        supplier.contactEmail?.toLowerCase().includes(query)
    )
  }, [suppliers, searchQuery])

  const handleAddSupplier = useCallback(() => {
    setEditingSupplier(null)
    setDialogOpen(true)
  }, [])

  const handleEditSupplier = useCallback((supplier: CachedSupplier) => {
    setEditingSupplier(supplier)
    setDialogOpen(true)
  }, [])

  const handleSaveSupplier = useCallback(
    (data: SupplierFormData) => {
      if (editingSupplier) {
        const updated = updateCachedSupplier(editingSupplier.id, data)
        if (updated) {
          setSuppliers((prev) =>
            prev.map((s) => (s.id === updated.id ? updated : s))
          )
          toast.success('Supplier updated')
        }
      } else {
        const created = createCachedSupplier(data as CreateCachedSupplierInput)
        setSuppliers((prev) => [created, ...prev])
        toast.success('Supplier added')
      }
      setEditingSupplier(null)
    },
    [editingSupplier]
  )

  const handleDeleteSupplier = useCallback(() => {
    if (!deleteId) return

    const deleted = deleteCachedSupplier(deleteId)
    if (deleted) {
      setSuppliers((prev) => prev.filter((s) => s.id !== deleteId))
      toast.success('Supplier deleted')
    } else {
      toast.error('Failed to delete supplier')
    }
    setDeleteId(null)
  }, [deleteId])

  const supplierToDelete = useMemo(
    () => suppliers.find((s) => s.id === deleteId),
    [suppliers, deleteId]
  )

  return (
    <div className="min-h-screen pb-16">
      {/* Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-40 top-[-10rem] h-[26rem] w-[26rem] rounded-full bg-[hsl(16_96%_58%/.12)] blur-3xl" />
        <div className="absolute right-[-12rem] top-[15%] h-[28rem] w-[28rem] rounded-full bg-[hsl(222_90%_56%/.10)] blur-3xl" />
        <div className="absolute bottom-[-8rem] left-[30%] h-[22rem] w-[22rem] rounded-full bg-[hsl(200_80%_45%/.08)] blur-3xl" />
        <div className="page-grain absolute inset-0 opacity-[0.25]" />
      </div>

      {/* Page Header */}
      <div className="border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Badge
                variant="secondary"
                className="text-[10px] font-semibold uppercase tracking-wider"
              >
                Supplier Network
              </Badge>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                Suppliers
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your supplier network for substance sourcing
              </p>
            </div>

            <Button onClick={handleAddSupplier} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Supplier
            </Button>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="border-b border-border/40 bg-secondary/20">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search suppliers by name, country, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {suppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 py-16">
            <Building2 className="h-12 w-12 text-muted-foreground/40" />
            <h2 className="mt-4 text-xl font-semibold">No suppliers yet</h2>
            <p className="mt-2 text-muted-foreground">
              Add your first supplier to start building your network
            </p>
            <Button onClick={handleAddSupplier} className="mt-6 gap-2">
              <Plus className="h-4 w-4" />
              Add First Supplier
            </Button>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 py-16">
            <Search className="h-12 w-12 text-muted-foreground/40" />
            <h2 className="mt-4 text-xl font-semibold">No results found</h2>
            <p className="mt-2 text-muted-foreground">
              Try adjusting your search query
            </p>
            <Button variant="outline" onClick={() => setSearchQuery('')} className="mt-6">
              Clear Search
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredSuppliers.length} supplier{filteredSuppliers.length !== 1 ? 's' : ''}
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {filteredSuppliers.map((supplier) => (
                <SupplierCard
                  key={supplier.id}
                  supplier={supplier}
                  onEdit={() => handleEditSupplier(supplier)}
                  onDelete={() => setDeleteId(supplier.id)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Supplier Dialog */}
      <SupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={editingSupplier}
        onSave={handleSaveSupplier}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Supplier
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{supplierToDelete?.name}"? This action
              cannot be undone. Substances referencing this supplier will keep their
              current data but won't be linked to this supplier anymore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSupplier}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Supplier
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
