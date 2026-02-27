const CATALOG_STORAGE_KEY = 't4s.user-ui-v2.catalog.v1'
const DRAFT_STORAGE_PREFIX = 't4s.user-ui-v2.draft.'

export const PRODUCT_CREATION_DRAFT_KEY = 'product-creation'
export const MATERIAL_CREATION_DRAFT_KEY = 'material-creation'

export interface CachedSupplier {
  id: string
  name: string
  countryOfOrigin: string
  address?: string
  contactEmail?: string
  contactPhone?: string
  website?: string
  notes?: string
  linkedWorkspaceId?: string
  createdAt: string
  updatedAt: string
}

export interface CachedImage {
  id: string
  url: string
  name?: string
  size?: number
  contentType?: string
}

export interface CachedUploadedFile {
  id: string
  name: string
  size: number
  type: string
  url?: string
}

export interface CachedMaterialCertificate {
  id: string
  type: string
  number: string
  expiryDate: string
  weight?: number
  files: CachedUploadedFile[]
}

export type CachedMaterialSubstanceInputType = 'chemical' | 'manual'
export type CachedMaterialSubstanceSourceType =
  | 'natural'
  | 'eu'
  | 'other'
  | 'no'

export interface CachedMaterialSubComposition {
  id: string
  inputType: CachedMaterialSubstanceInputType
  substanceName: string
  substanceCode: string
  percentage: number
  projectedWeight: number
  supplierId: string
  supplierName: string
  countryOfOrigin?: string
  reachRegistrationNumber?: string
  documents: CachedUploadedFile[]
}

export interface CachedMaterialSubstance {
  id: string
  inputType: CachedMaterialSubstanceInputType
  substanceName: string
  substanceCode: string
  percentage: number
  projectedWeight: number
  subCompositions: CachedMaterialSubComposition[]
  sourceType?: CachedMaterialSubstanceSourceType
  otherSourceReason?: string
  reachRegistrationNumber?: string
  supplierId: string
  supplierName: string
  countryOfOrigin?: string
  documents: CachedUploadedFile[]
}

export interface CachedMaterial {
  id: string
  name: string
  description?: string
  unitOfMeasurement: string
  unitCost: number
  unitCostCurrency: string
  weight: number
  length?: number
  width?: number
  height?: number
  photos: CachedImage[]
  certificates: CachedMaterialCertificate[]
  substances: CachedMaterialSubstance[]
  workspaceId?: string
  createdAt: string
  updatedAt: string
}

export interface CachedProductBomItem {
  id: string
  materialId: string
  materialName: string
  unitOfMeasurement: string
  unitCost: number
  unitCostCurrency: string
  quantity: number
  percentage: number
}

export interface CachedProductBom {
  items: CachedProductBomItem[]
  updatedAt: string
}

export interface CachedProduct {
  id: string
  name: string
  upc: string
  sku?: string
  description?: string
  categoryType: string
  subCategory: string
  unitOfMeasure: string
  measureValue: number
  weight?: number
  color?: string
  collection?: string
  hsCode?: string
  externalReference?: string
  isActive: boolean
  photos: CachedImage[]
  bom?: CachedProductBom
  workspaceId?: string
  createdAt: string
  updatedAt: string
}

interface CatalogCache {
  products: CachedProduct[]
  materials: CachedMaterial[]
  suppliers: CachedSupplier[]
}

export type CreateCachedProductInput = Omit<
  CachedProduct,
  'id' | 'createdAt' | 'updatedAt' | 'bom'
>
export type CreateCachedMaterialInput = Omit<
  CachedMaterial,
  'id' | 'createdAt' | 'updatedAt'
>
export type CreateCachedSupplierInput = Omit<
  CachedSupplier,
  'id' | 'createdAt' | 'updatedAt'
>
export type UpdateCachedSupplierInput = Partial<
  Omit<CachedSupplier, 'id' | 'createdAt' | 'updatedAt'>
>

function getDefaultCatalogCache(): CatalogCache {
  return {
    products: [],
    materials: [],
    suppliers: [],
  }
}

function safeParse<T>(value: string | null): T | null {
  if (!value) return null

  try {
    return JSON.parse(value) as T
  } catch (error) {
    console.error('Failed to parse cached value:', error)
    return null
  }
}

function sanitizeForStorage<T>(value: T): T {
  const visit = (input: unknown): unknown => {
    if (input === null || input === undefined) return input
    if (input instanceof File || input instanceof Blob) return undefined

    if (Array.isArray(input)) {
      return input
        .map((item) => visit(item))
        .filter((item) => item !== undefined)
    }

    if (typeof input === 'object') {
      const output: Record<string, unknown> = {}
      for (const [key, nestedValue] of Object.entries(input)) {
        const sanitizedValue = visit(nestedValue)
        if (sanitizedValue !== undefined) {
          output[key] = sanitizedValue
        }
      }
      return output
    }

    return input
  }

  return visit(value) as T
}

function readCatalogCache(): CatalogCache {
  if (typeof window === 'undefined') {
    return getDefaultCatalogCache()
  }

  const parsed = safeParse<CatalogCache>(
    localStorage.getItem(CATALOG_STORAGE_KEY)
  )
  if (!parsed) return getDefaultCatalogCache()

  const materials = Array.isArray(parsed.materials)
    ? parsed.materials.map((material) => {
        const safeMaterial = material as Partial<CachedMaterial>

        const substances = Array.isArray(safeMaterial.substances)
          ? safeMaterial.substances.map((substance) => {
              const safeSubstance =
                substance as Partial<CachedMaterialSubstance>
              return {
                ...safeSubstance,
                subCompositions: Array.isArray(safeSubstance.subCompositions)
                  ? safeSubstance.subCompositions
                  : [],
              } as CachedMaterialSubstance
            })
          : []

        return {
          ...safeMaterial,
          photos: Array.isArray(safeMaterial.photos) ? safeMaterial.photos : [],
          certificates: Array.isArray(safeMaterial.certificates)
            ? safeMaterial.certificates
            : [],
          substances,
        } as CachedMaterial
      })
    : []

  return {
    products: Array.isArray(parsed.products) ? parsed.products : [],
    materials,
    suppliers: Array.isArray(parsed.suppliers) ? parsed.suppliers : [],
  }
}

function writeCatalogCache(cache: CatalogCache) {
  if (typeof window === 'undefined') return

  localStorage.setItem(
    CATALOG_STORAGE_KEY,
    JSON.stringify(sanitizeForStorage(cache))
  )
}

export function getCachedProducts(): CachedProduct[] {
  return readCatalogCache().products
}

export function getCachedMaterials(): CachedMaterial[] {
  return readCatalogCache().materials
}

export function getCachedProductById(productId: string): CachedProduct | null {
  return (
    readCatalogCache().products.find((product) => product.id === productId) ??
    null
  )
}

export function getCachedMaterialById(
  materialId: string
): CachedMaterial | null {
  return (
    readCatalogCache().materials.find(
      (material) => material.id === materialId
    ) ?? null
  )
}

export function createCachedProduct(
  input: CreateCachedProductInput
): CachedProduct {
  const cache = readCatalogCache()
  const now = new Date().toISOString()

  const product: CachedProduct = {
    ...sanitizeForStorage(input),
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }

  cache.products = [product, ...cache.products]
  writeCatalogCache(cache)

  return product
}

export function createCachedMaterial(
  input: CreateCachedMaterialInput
): CachedMaterial {
  const cache = readCatalogCache()
  const now = new Date().toISOString()

  const material: CachedMaterial = {
    ...sanitizeForStorage(input),
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }

  cache.materials = [material, ...cache.materials]
  writeCatalogCache(cache)

  return material
}

export function saveProductBomToCache(
  productId: string,
  bomItems: CachedProductBomItem[]
): CachedProduct | null {
  const cache = readCatalogCache()
  const productIndex = cache.products.findIndex(
    (product) => product.id === productId
  )
  if (productIndex === -1) return null

  const now = new Date().toISOString()
  const nextProduct: CachedProduct = {
    ...cache.products[productIndex],
    bom: {
      items: sanitizeForStorage(bomItems),
      updatedAt: now,
    },
    updatedAt: now,
  }

  cache.products[productIndex] = nextProduct
  writeCatalogCache(cache)

  return nextProduct
}

export type UpdateCachedMaterialInput = Partial<
  Omit<CachedMaterial, 'id' | 'createdAt' | 'updatedAt'>
>

export function updateCachedMaterial(
  materialId: string,
  updates: UpdateCachedMaterialInput
): CachedMaterial | null {
  const cache = readCatalogCache()
  const materialIndex = cache.materials.findIndex(
    (material) => material.id === materialId
  )
  if (materialIndex === -1) return null

  const now = new Date().toISOString()
  const nextMaterial: CachedMaterial = {
    ...cache.materials[materialIndex],
    ...sanitizeForStorage(updates),
    id: materialId,
    createdAt: cache.materials[materialIndex].createdAt,
    updatedAt: now,
  }

  cache.materials[materialIndex] = nextMaterial
  writeCatalogCache(cache)

  return nextMaterial
}

export function deleteCachedMaterial(materialId: string): boolean {
  const cache = readCatalogCache()
  const materialIndex = cache.materials.findIndex(
    (material) => material.id === materialId
  )
  if (materialIndex === -1) return false

  cache.materials.splice(materialIndex, 1)
  writeCatalogCache(cache)

  return true
}

export function deleteCachedProduct(productId: string): boolean {
  const cache = readCatalogCache()
  const productIndex = cache.products.findIndex(
    (product) => product.id === productId
  )
  if (productIndex === -1) return false

  cache.products.splice(productIndex, 1)
  writeCatalogCache(cache)

  return true
}

function buildDraftStorageKey(draftKey: string): string {
  return `${DRAFT_STORAGE_PREFIX}${draftKey}`
}

export function getCachedDraft<T>(draftKey: string): T | null {
  if (typeof window === 'undefined') return null
  return safeParse<T>(localStorage.getItem(buildDraftStorageKey(draftKey)))
}

export function setCachedDraft<T>(draftKey: string, value: T) {
  if (typeof window === 'undefined') return
  localStorage.setItem(
    buildDraftStorageKey(draftKey),
    JSON.stringify(sanitizeForStorage(value))
  )
}

export function clearCachedDraft(draftKey: string) {
  if (typeof window === 'undefined') return
  localStorage.removeItem(buildDraftStorageKey(draftKey))
}

// Supplier CRUD operations
export function getCachedSuppliers(): CachedSupplier[] {
  return readCatalogCache().suppliers
}

export function getCachedSupplierById(
  supplierId: string
): CachedSupplier | null {
  return (
    readCatalogCache().suppliers.find(
      (supplier) => supplier.id === supplierId
    ) ?? null
  )
}

export function createCachedSupplier(
  input: CreateCachedSupplierInput
): CachedSupplier {
  const cache = readCatalogCache()
  const now = new Date().toISOString()

  const supplier: CachedSupplier = {
    ...sanitizeForStorage(input),
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }

  cache.suppliers = [supplier, ...cache.suppliers]
  writeCatalogCache(cache)

  return supplier
}

export function updateCachedSupplier(
  supplierId: string,
  updates: UpdateCachedSupplierInput
): CachedSupplier | null {
  const cache = readCatalogCache()
  const supplierIndex = cache.suppliers.findIndex(
    (supplier) => supplier.id === supplierId
  )
  if (supplierIndex === -1) return null

  const now = new Date().toISOString()
  const nextSupplier: CachedSupplier = {
    ...cache.suppliers[supplierIndex],
    ...sanitizeForStorage(updates),
    id: supplierId,
    createdAt: cache.suppliers[supplierIndex].createdAt,
    updatedAt: now,
  }

  cache.suppliers[supplierIndex] = nextSupplier
  writeCatalogCache(cache)

  return nextSupplier
}

export function deleteCachedSupplier(supplierId: string): boolean {
  const cache = readCatalogCache()
  const supplierIndex = cache.suppliers.findIndex(
    (supplier) => supplier.id === supplierId
  )
  if (supplierIndex === -1) return false

  cache.suppliers.splice(supplierIndex, 1)
  writeCatalogCache(cache)

  return true
}
