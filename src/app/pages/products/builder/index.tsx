import { useState, useRef } from 'react'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import {
  Package,
  Layers,
  FlaskConical,
  Plus,
  Trash2,
  Save,
  X,
  Settings2,
  Copy,
  FileSpreadsheet,
  Download,
  Upload,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useWorkspace, WORKSPACES } from '@/app/contexts/workspace-context'
import { useProductBuilder, type Substance } from './use-product-builder'
import {
  createCachedProduct,
  createCachedMaterial,
  saveProductBomToCache,
  getCachedSuppliers,
  type CachedProductBomItem,
} from '@/infrastructure/cache/catalog-cache'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'

export function ProductBuilderPage() {
  const { activeWorkspace } = useWorkspace()
  const {
    draft,
    updateProduct,
    addComponent,
    duplicateComponent,
    updateComponent,
    removeComponent,
    addSubstance,
    duplicateSubstance,
    updateSubstance,
    removeSubstance,
    importSubstancesFromExcel,
    clearDraft,
  } = useProductBuilder()

  const navigate = useNavigate()

  // Sheet states
  const [activeSubstance, setActiveSubstance] = useState<{
    compId: string
    sub: Substance
  } | null>(null)

  // File input refs for CSV import
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  // Approval Modal states
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false)
  const [selectedSO, setSelectedSO] = useState('')
  const [selectedPOItem, setSelectedPOItem] = useState('')
  const [eanQuantity, setEanQuantity] = useState('')

  const [searchParams] = useSearchParams()

  useEffect(() => {
    const soId = searchParams.get('soId')
    const poItemId = searchParams.get('poItemId')
    const itemName = searchParams.get('itemName')

    if (itemName && !draft.name) {
      updateProduct({ name: itemName })
    }
    if (soId && poItemId) {
      setSelectedSO(soId)
      setSelectedPOItem(poItemId)
    }
  }, [searchParams])

  const saveProductToCatalog = () => {
    // 1. Create all components as Materials in cache
    const bomItems: CachedProductBomItem[] = []

    for (const comp of draft.components) {
      const material = createCachedMaterial({
        name: comp.name || 'Unnamed Component',
        unitOfMeasurement: 'piece',
        unitCost: 0,
        unitCostCurrency: 'USD',
        weight: comp.weight || 0,
        photos: [],
        certificates: [],
        substances: comp.substances.map((s) => ({
          id: s.id,
          inputType: 'manual',
          substanceName: s.name,
          substanceCode: s.casNumber,
          percentage: s.percentage,
          projectedWeight: ((comp.weight || 0) * s.percentage) / 100,
          subCompositions: [],
          supplierId: s.supplier || '',
          supplierName: s.supplier || '',
          reachRegistrationNumber: s.reachRegistration,
          documents: [],
        })),
        workspaceId: activeWorkspace.id,
      })

      bomItems.push({
        id: Math.random().toString(36).substring(2, 9),
        materialId: material.id,
        materialName: material.name,
        unitOfMeasurement: material.unitOfMeasurement,
        unitCost: material.unitCost,
        unitCostCurrency: material.unitCostCurrency,
        quantity: 1,
        percentage: (1 / (draft.components.length || 1)) * 100, // Rough approx for demo
      })
    }

    // 2. Create Product
    const product = createCachedProduct({
      name: draft.name,
      upc: draft.upc,
      sku: draft.sku,
      categoryType: draft.categoryType,
      subCategory: draft.subCategory,
      unitOfMeasure: draft.unitOfMeasure,
      measureValue: 1,
      isActive: true,
      photos: [],
      workspaceId: activeWorkspace.id,
    })

    // 3. Link BOM
    if (bomItems.length > 0) {
      saveProductBomToCache(product.id, bomItems)
    }

    return product
  }

  const handleSave = () => {
    if (!draft.name || !draft.upc) {
      toast.error('Missing Required Fields', {
        description: 'Please provide a Product Name and UPC before saving.',
      })
      return
    }

    try {
      const product = saveProductToCatalog()

      toast.success('Product saved successfully!', {
        description: `"${product.name}" has been added to your catalog.`,
      })

      clearDraft()
      navigate(`/catalog/products/${product.id}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to save product to catalog.')
    }
  }

  const handleRequestApproval = () => {
    if (!draft.name || !draft.upc) {
      toast.error('Missing Required Fields', {
        description:
          'Please provide a Product Name and UPC before requesting approval.',
      })
      return
    }
    setIsApprovalModalOpen(true)
  }

  const submitApprovalRequest = () => {
    if (!selectedSO || !selectedPOItem || !eanQuantity) {
      toast.error('Missing Required Fields', {
        description:
          'Please select a Customer, Sales Order, Purchase Item, and enter the EAN Quantity.',
      })
      return
    }

    // In a real app, this would use the selectedSO to find the buyer
    const targetWorkspace = WORKSPACES.find((w) => w.id === selectedSO)

    try {
      const existing = JSON.parse(
        localStorage.getItem('t4s-demo-approvals') || '[]'
      )

      // Check for existing pending or approved requests for this SO/PO
      const hasExisting = existing.some(
        (a: any) =>
          a.soId === selectedSO &&
          a.poItemId === selectedPOItem &&
          a.status !== 'REJECTED'
      )

      if (hasExisting) {
        toast.error('Duplicate Request', {
          description:
            'An active approval request already exists for this Sales Order and Purchase Item.',
        })
        return
      }

      // Actually save the product to catalog as well
      const product = saveProductToCatalog()

      const newApproval = {
        id: Math.random().toString(36).substring(2, 9),
        productId: product.id,
        productName: draft.name,
        sku: draft.sku || draft.upc,
        requesterName: activeWorkspace.name,
        requesterId: activeWorkspace.id,
        approverId: targetWorkspace?.id || 'ws-brand-1',
        soId: selectedSO,
        poItemId: selectedPOItem,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      }

      localStorage.setItem(
        't4s-demo-approvals',
        JSON.stringify([newApproval, ...existing])
      )

      setIsApprovalModalOpen(false)
      // Reset fields
      setSelectedSO('')
      setSelectedPOItem('')
      setEanQuantity('')

      toast.success('Approval Requested', {
        description: `Your product has been saved and submitted to ${targetWorkspace?.name || 'the brand'} for review.`,
      })

      clearDraft()
      navigate('/catalog/approvals')
    } catch {
      toast.error('Failed to submit approval request')
    }
  }

  const handleClear = () => {
    clearDraft()
    toast.info('Draft cleared.')
  }

  const downloadTemplate = async () => {
    const suppliersList = getCachedSuppliers()
    const supplierNames = suppliersList.map((s) => s.name)

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Substances Import')

    // Add instructions row
    worksheet.addRow([
      'Instructions: Fill out the rows below. For the Supplier column, select from the dropdown.',
    ])
    worksheet.mergeCells('A1:D1')
    worksheet.getCell('A1').font = { bold: true, color: { argb: 'FF3730A3' } }
    worksheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E7FF' },
    }

    // Add headers
    worksheet.addRow(['Name', 'CAS Number', 'Percentage', 'Supplier'])
    const headerRow = worksheet.getRow(2)
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3F4F6' },
    }

    // Set column widths
    worksheet.columns = [
      { width: 30 },
      { width: 20 },
      { width: 15 },
      { width: 40 },
    ]

    // Add an example row
    worksheet.addRow([
      'Example Substance',
      '9009-54-5',
      50,
      suppliersList.length > 0 ? suppliersList[0].name : '',
    ])

    // Add data validation for the Supplier column (Column D, from row 3 to 1000)
    if (supplierNames.length > 0) {
      // Create a hidden worksheet for the supplier list to avoid the 255 character limit in data validation formula
      const listSheet = workbook.addWorksheet('SuppliersList', {
        state: 'hidden',
      })
      supplierNames.forEach((name, index) => {
        listSheet.getCell(`A${index + 1}`).value = name
      })

      for (let i = 3; i <= 1000; i++) {
        worksheet.getCell(`D${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`SuppliersList!$A$1:$A$${supplierNames.length}`],
          showErrorMessage: true,
          errorStyle: 'stop',
          errorTitle: 'Invalid Supplier',
          error: 'Please select a supplier from the dropdown list.',
        }
      }
    }

    // Generate and save file
    const buffer = await workbook.xlsx.writeBuffer()
    saveAs(new Blob([buffer]), 'substances_import_template.xlsx')
  }

  const handleFileUpload = async (
    compId: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(await file.arrayBuffer())

      const worksheet = workbook.getWorksheet('Substances Import')
      if (!worksheet) {
        toast.error(
          'Invalid template. Could not find "Substances Import" sheet.'
        )
        return
      }

      const newSubstances: {
        name: string
        casNumber: string
        percentage: number
        supplier: string
      }[] = []

      // Start from row 3 (after instructions and headers)
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 2) {
          const name = row.getCell(1).text?.trim()
          if (name) {
            newSubstances.push({
              name,
              casNumber: row.getCell(2).text?.trim() || '',
              percentage: parseFloat(row.getCell(3).text) || 0,
              supplier: row.getCell(4).text?.trim() || '',
            })
          }
        }
      })

      if (newSubstances.length > 0) {
        importSubstancesFromExcel(compId, newSubstances)
        toast.success(
          `Successfully imported ${newSubstances.length} substances`
        )
      } else {
        toast.info('No substances found in the file')
      }
    } catch (err) {
      console.error(err)
      toast.error(
        'Failed to parse Excel file. Please ensure you are using the downloaded template.'
      )
    }

    // Reset input
    if (fileInputRefs.current[compId]) {
      fileInputRefs.current[compId]!.value = ''
    }
  }

  return (
    <div className="relative min-h-screen pb-24">
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-36 top-[-12rem] h-[30rem] w-[30rem] rounded-full bg-[hsl(16_96%_58%/.14)] blur-3xl" />
        <div className="absolute -right-40 top-[18%] h-[28rem] w-[28rem] rounded-full bg-[hsl(222_88%_54%/.12)] blur-3xl" />
        <div className="page-grain absolute inset-0 opacity-[0.3]" />
      </div>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Header */}
        <div className="animate-fade-up flex items-center justify-between">
          <div>
            <Badge className="mb-4 rounded-full bg-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
              Advanced Builder
            </Badge>
            <h1 className="flex items-center gap-3 text-4xl leading-tight sm:text-5xl">
              Unified Product Builder
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Construct complex products by defining their components and deeply
              nested chemical substances.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleClear} className="gap-2">
              <X className="h-4 w-4" /> Clear
            </Button>
            <Button variant="accent" onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" /> Save Product
            </Button>
            {activeWorkspace.type === 'MANUFACTURER' && (
              <Button
                variant="default"
                onClick={handleRequestApproval}
                className="gap-2 bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
              >
                <ShieldCheck className="h-4 w-4" /> Submit for Approval
              </Button>
            )}
          </div>
        </div>

        {/* Product Level */}
        <section className="surface-panel animate-fade-up stagger-1 relative space-y-6 overflow-hidden rounded-3xl border border-border/50 p-6 shadow-sm sm:p-8">
          <div className="absolute -right-16 top-0 h-56 w-56 rounded-full bg-[hsl(var(--accent)/0.08)] blur-3xl" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <Package className="h-5 w-5 text-accent" />
            </div>
            <h2 className="text-xl font-semibold">1. Product Identity</h2>
          </div>

          <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="product-name">
                Product Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="product-name"
                placeholder="e.g. Eco-Friendly Running Shoe"
                value={draft.name}
                onChange={(e) => updateProduct({ name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-upc">
                UPC / EAN <span className="text-red-500">*</span>
              </Label>
              <Input
                id="product-upc"
                placeholder="e.g. 5901234123457"
                value={draft.upc}
                onChange={(e) => updateProduct({ upc: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-sku">SKU</Label>
              <Input
                id="product-sku"
                placeholder="e.g. SHOE-ECO-01"
                value={draft.sku}
                onChange={(e) => updateProduct({ sku: e.target.value })}
              />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <Label>
                Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={draft.categoryType || ''}
                onValueChange={(val) =>
                  updateProduct({ categoryType: val, subCategory: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Apparel">Apparel</SelectItem>
                  <SelectItem value="Footwear">Footwear</SelectItem>
                  <SelectItem value="Accessories">Accessories</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 lg:col-span-1">
              <Label>
                Sub-Category <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Sneakers"
                value={draft.subCategory}
                onChange={(e) => updateProduct({ subCategory: e.target.value })}
              />
            </div>
            <div className="space-y-2 lg:col-span-1">
              <Label>
                Unit of Measure <span className="text-red-500">*</span>
              </Label>
              <Select
                value={draft.unitOfMeasure || 'piece'}
                onValueChange={(val) => updateProduct({ unitOfMeasure: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="piece">Piece</SelectItem>
                  <SelectItem value="pair">Pair</SelectItem>
                  <SelectItem value="set">Set</SelectItem>
                  <SelectItem value="kg">Kilogram</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Components Level */}
        <section className="animate-fade-up stagger-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                <Layers className="h-4 w-4 text-blue-500" />
              </div>
              <h2 className="text-xl font-semibold">2. Components</h2>
            </div>
            <Button
              onClick={addComponent}
              size="sm"
              variant="secondary"
              className="gap-2"
            >
              <Plus className="h-4 w-4" /> Add Component
            </Button>
          </div>

          {draft.components.length === 0 ? (
            <div className="surface-subtle rounded-2xl border border-dashed border-border p-10 text-center">
              <Layers className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
              <h3 className="text-lg font-medium text-foreground">
                No components yet
              </h3>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">
                Products are made of one or more components. Add a component to
                get started.
              </p>
              <Button
                onClick={addComponent}
                variant="outline"
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> Add Component
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {draft.components.map((component) => (
                <div
                  key={component.id}
                  className="surface-subtle rounded-3xl border border-border/60 p-6 shadow-sm"
                >
                  {/* Component Header & Basic Info */}
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="grid flex-1 gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Component Name
                        </Label>
                        <Input
                          placeholder="e.g. Rubber Sole"
                          value={component.name}
                          onChange={(e) =>
                            updateComponent(component.id, {
                              name: e.target.value,
                            })
                          }
                          className="bg-background/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Material Type
                        </Label>
                        <Input
                          placeholder="e.g. Synthetic Rubber"
                          value={component.materialType}
                          onChange={(e) =>
                            updateComponent(component.id, {
                              materialType: e.target.value,
                            })
                          }
                          className="bg-background/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Weight (g)
                        </Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={component.weight || ''}
                          onChange={(e) =>
                            updateComponent(component.id, {
                              weight: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="bg-background/50"
                        />
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => duplicateComponent(component.id)}
                        className="text-muted-foreground hover:text-foreground"
                        title="Duplicate Component"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeComponent(component.id)}
                        className="text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                        title="Delete Component"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Substances Level (Nested inside Component) */}
                  <div className="mt-6 rounded-2xl border border-border/50 bg-background/30 p-5">
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="h-4 w-4 text-emerald-500" />
                        <h3 className="text-sm font-semibold">Substances</h3>
                        <Badge
                          variant="outline"
                          className="ml-2 font-mono text-[10px]"
                        >
                          {component.substances.length}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={downloadTemplate}
                          size="sm"
                          variant="ghost"
                          className="h-7 gap-1 text-xs text-muted-foreground"
                        >
                          <Download className="h-3 w-3" /> Template
                        </Button>
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          className="hidden"
                          ref={(el) => {
                            fileInputRefs.current[component.id] = el
                          }}
                          onChange={(e) => handleFileUpload(component.id, e)}
                        />
                        <Button
                          onClick={() =>
                            fileInputRefs.current[component.id]?.click()
                          }
                          size="sm"
                          variant="secondary"
                          className="h-7 gap-1 border border-indigo-500/20 bg-indigo-500/10 text-xs text-indigo-600 hover:bg-indigo-500/20"
                        >
                          <FileSpreadsheet className="h-3 w-3" /> Excel Import
                        </Button>
                        <Button
                          onClick={() => addSubstance(component.id)}
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs"
                        >
                          <Plus className="h-3 w-3" /> Add Row
                        </Button>
                      </div>
                    </div>

                    {component.substances.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border/60 bg-background/50 p-6 text-center text-sm text-muted-foreground">
                        <p>No chemical substances defined.</p>
                        <p className="mt-1 text-xs opacity-70">
                          Add a row manually or import from an Excel file to
                          save time.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Headers */}
                        <div className="hidden items-center gap-3 px-3 pb-1 sm:flex">
                          <div className="min-w-[150px] flex-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Substance Name
                          </div>
                          <div className="w-[120px] shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            CAS Number
                          </div>
                          <div className="w-[80px] shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Mix (%)
                          </div>
                          <div className="w-[104px] shrink-0"></div>
                        </div>

                        {/* Rows */}
                        {component.substances.map((substance) => (
                          <div
                            key={substance.id}
                            className="group flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-background p-2 pl-3 shadow-sm transition-colors hover:border-border sm:flex-nowrap"
                          >
                            <div className="min-w-[150px] flex-1">
                              <Input
                                placeholder="e.g. Polyurethane"
                                value={substance.name}
                                onChange={(e) =>
                                  updateSubstance(component.id, substance.id, {
                                    name: e.target.value,
                                  })
                                }
                                title="Substance Name"
                                className="h-8 border-transparent bg-secondary/30 text-sm transition-colors hover:border-border focus:border-ring"
                              />
                            </div>
                            <div className="w-[120px] shrink-0">
                              <Input
                                placeholder="CAS No."
                                value={substance.casNumber}
                                onChange={(e) =>
                                  updateSubstance(component.id, substance.id, {
                                    casNumber: e.target.value,
                                  })
                                }
                                title="CAS Number"
                                className="h-8 border-transparent bg-secondary/30 font-mono text-sm transition-colors hover:border-border focus:border-ring"
                              />
                            </div>
                            <div className="flex w-[80px] shrink-0 items-center gap-2">
                              <Input
                                type="number"
                                placeholder="0"
                                value={substance.percentage || ''}
                                onChange={(e) =>
                                  updateSubstance(component.id, substance.id, {
                                    percentage: parseFloat(e.target.value) || 0,
                                  })
                                }
                                title="Mix Percentage"
                                className="h-8 border-transparent bg-secondary/30 text-sm transition-colors hover:border-border focus:border-ring"
                              />
                              <span className="text-xs font-medium text-muted-foreground">
                                %
                              </span>
                            </div>

                            <div className="flex shrink-0 gap-1 opacity-100 transition-opacity focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setActiveSubstance({
                                    compId: component.id,
                                    sub: substance,
                                  })
                                }
                                className="h-8 w-8 text-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-600"
                                title="Configure Deep Data"
                              >
                                <Settings2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  duplicateSubstance(component.id, substance.id)
                                }
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                title="Duplicate Row"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  removeSubstance(component.id, substance.id)
                                }
                                className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                                title="Delete Row"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Advanced Substance Configuration Sheet */}
      <Sheet
        open={!!activeSubstance}
        onOpenChange={(open) => !open && setActiveSubstance(null)}
      >
        <SheetContent className="w-[400px] overflow-y-auto sm:w-[540px]">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-emerald-500" />
              Configure Substance
            </SheetTitle>
            <SheetDescription>
              Provide deep regulatory and supply chain data for{' '}
              <strong className="text-foreground">
                {activeSubstance?.sub.name || 'this substance'}
              </strong>
              .
            </SheetDescription>
          </SheetHeader>

          {activeSubstance && (
            <div className="space-y-8">
              {/* Basic Mirror */}
              <div className="grid gap-4 rounded-xl bg-secondary/30 p-4">
                <div className="space-y-2">
                  <Label>Substance Name</Label>
                  <Input
                    value={activeSubstance.sub.name}
                    onChange={(e) => {
                      updateSubstance(
                        activeSubstance.compId,
                        activeSubstance.sub.id,
                        { name: e.target.value }
                      )
                      setActiveSubstance((prev) =>
                        prev
                          ? {
                              ...prev,
                              sub: { ...prev.sub, name: e.target.value },
                            }
                          : null
                      )
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>CAS Number</Label>
                    <Input
                      value={activeSubstance.sub.casNumber}
                      onChange={(e) => {
                        updateSubstance(
                          activeSubstance.compId,
                          activeSubstance.sub.id,
                          { casNumber: e.target.value }
                        )
                        setActiveSubstance((prev) =>
                          prev
                            ? {
                                ...prev,
                                sub: { ...prev.sub, casNumber: e.target.value },
                              }
                            : null
                        )
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Percentage (%)</Label>
                    <Input
                      type="number"
                      value={activeSubstance.sub.percentage || ''}
                      onChange={(e) => {
                        updateSubstance(
                          activeSubstance.compId,
                          activeSubstance.sub.id,
                          { percentage: parseFloat(e.target.value) || 0 }
                        )
                        setActiveSubstance((prev) =>
                          prev
                            ? {
                                ...prev,
                                sub: {
                                  ...prev.sub,
                                  percentage: parseFloat(e.target.value) || 0,
                                },
                              }
                            : null
                        )
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Data */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Supply Chain
                </h3>
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Input
                    placeholder="e.g. Acme Chemicals Ltd."
                    value={activeSubstance.sub.supplier || ''}
                    onChange={(e) => {
                      updateSubstance(
                        activeSubstance.compId,
                        activeSubstance.sub.id,
                        { supplier: e.target.value }
                      )
                      setActiveSubstance((prev) =>
                        prev
                          ? {
                              ...prev,
                              sub: { ...prev.sub, supplier: e.target.value },
                            }
                          : null
                      )
                    }}
                  />
                  <p className="text-[10px] italic text-muted-foreground">
                    In a full version, this would be a searchable catalog
                    dropdown.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  REACH Compliance
                </h3>
                <div className="space-y-2">
                  <Label>Exemption Status</Label>
                  <Select
                    value={activeSubstance.sub.reachExemption || 'none'}
                    onValueChange={(val) => {
                      updateSubstance(
                        activeSubstance.compId,
                        activeSubstance.sub.id,
                        { reachExemption: val }
                      )
                      setActiveSubstance((prev) =>
                        prev
                          ? {
                              ...prev,
                              sub: { ...prev.sub, reachExemption: val },
                            }
                          : null
                      )
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        No Exemption (Requires Registration)
                      </SelectItem>
                      <SelectItem value="natural">
                        Naturally Occurring
                      </SelectItem>
                      <SelectItem value="eu-sourced">
                        EU-Sourced (Annex V)
                      </SelectItem>
                      <SelectItem value="other">Other Exemption</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(!activeSubstance.sub.reachExemption ||
                  activeSubstance.sub.reachExemption === 'none') && (
                  <div className="space-y-2">
                    <Label>
                      REACH Registration Number{' '}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. 01-2119457610-43-XXXX"
                      value={activeSubstance.sub.reachRegistration || ''}
                      onChange={(e) => {
                        updateSubstance(
                          activeSubstance.compId,
                          activeSubstance.sub.id,
                          { reachRegistration: e.target.value }
                        )
                        setActiveSubstance((prev) =>
                          prev
                            ? {
                                ...prev,
                                sub: {
                                  ...prev.sub,
                                  reachRegistration: e.target.value,
                                },
                              }
                            : null
                        )
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    SDS Documents
                  </h3>
                  <Badge variant="secondary">0 files</Badge>
                </div>

                {/* Mock Dropzone */}
                <div className="cursor-pointer rounded-xl border-2 border-dashed border-border/60 bg-secondary/20 p-8 text-center transition-colors hover:bg-secondary/40">
                  <Upload className="mx-auto mb-3 h-6 w-6 text-muted-foreground/60" />
                  <p className="text-sm font-medium">
                    Click or drag SDS files here
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PDF up to 4MB. System will attempt to auto-match by CAS
                    number.
                  </p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Request Approval Dialog */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Submit for Approval</DialogTitle>
            <DialogDescription>
              Link this product to a Sales Order and Purchase Item to submit it
              for approval by the brand.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label>
                Customer / Buyer <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedSO}
                onValueChange={(val) => {
                  setSelectedSO(val)
                  setSelectedPOItem('')
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a Customer Workspace" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ws-brand-1">
                    Action Distributie (ws-brand-1)
                  </SelectItem>
                  <SelectItem value="ws-brand-2">
                    Another Brand (ws-brand-2)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Linked Sales Order <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedSO ? 'SO-2024-001' : ''}
                disabled={!selectedSO}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      selectedSO
                        ? 'Select a Sales Order'
                        : 'Select a Customer first'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SO-2024-001">SO-2024-001</SelectItem>
                  <SelectItem value="SO-2024-089">SO-2024-089</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Purchase Item <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedPOItem}
                onValueChange={setSelectedPOItem}
                disabled={!selectedSO}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      selectedSO
                        ? 'Select a Purchase Item'
                        : 'Select a Sales Order first'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pi-1">
                    Eco-Friendly Running Shoe (Size 10)
                  </SelectItem>
                  <SelectItem value="pi-2">
                    Eco-Friendly Running Shoe (Size 11)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                EAN Quantity <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                placeholder="e.g. 5000"
                value={eanQuantity}
                onChange={(e) => setEanQuantity(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApprovalModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={submitApprovalRequest}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
