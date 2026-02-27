import { useState, useEffect } from 'react'

export type Substance = {
  id: string
  name: string
  casNumber: string
  percentage: number
  supplier?: string
  reachExemption?: string
  reachRegistration?: string
  sdsDocuments?: string[]
}

export type ProductComponent = {
  id: string
  name: string
  materialType: string
  weight: number
  substances: Substance[]
}

export type ProductDraft = {
  name: string
  upc: string
  sku: string
  categoryType: string
  subCategory: string
  unitOfMeasure: string
  components: ProductComponent[]
}

const STORAGE_KEY = 'product-builder-draft-v1'

const defaultDraft: ProductDraft = {
  name: '',
  upc: '',
  sku: '',
  categoryType: '',
  subCategory: '',
  unitOfMeasure: 'piece',
  components: [],
}

// Generate random UUID-like string
function generateId() {
  return Math.random().toString(36).substring(2, 9)
}

export function useProductBuilder() {
  const [draft, setDraft] = useState<ProductDraft>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : defaultDraft
    } catch {
      return defaultDraft
    }
  })

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  }, [draft])

  const updateProduct = (updates: Partial<ProductDraft>) => {
    setDraft((prev) => ({ ...prev, ...updates }))
  }

  const addComponent = () => {
    setDraft((prev) => ({
      ...prev,
      components: [
        ...prev.components,
        {
          id: generateId(),
          name: '',
          materialType: '',
          weight: 0,
          substances: [],
        },
      ],
    }))
  }

  const duplicateComponent = (componentId: string) => {
    setDraft((prev) => {
      const compToClone = prev.components.find((c) => c.id === componentId)
      if (!compToClone) return prev

      const clonedComp = {
        ...compToClone,
        id: generateId(),
        name: `${compToClone.name} (Copy)`,
        substances: compToClone.substances.map((s) => ({
          ...s,
          id: generateId(),
        })),
      }

      return {
        ...prev,
        components: [...prev.components, clonedComp],
      }
    })
  }

  const updateComponent = (
    componentId: string,
    updates: Partial<ProductComponent>
  ) => {
    setDraft((prev) => ({
      ...prev,
      components: prev.components.map((c) =>
        c.id === componentId ? { ...c, ...updates } : c
      ),
    }))
  }

  const removeComponent = (componentId: string) => {
    setDraft((prev) => ({
      ...prev,
      components: prev.components.filter((c) => c.id !== componentId),
    }))
  }

  const addSubstance = (componentId: string) => {
    setDraft((prev) => ({
      ...prev,
      components: prev.components.map((c) => {
        if (c.id === componentId) {
          return {
            ...c,
            substances: [
              ...c.substances,
              { id: generateId(), name: '', casNumber: '', percentage: 0 },
            ],
          }
        }
        return c
      }),
    }))
  }

  const duplicateSubstance = (componentId: string, substanceId: string) => {
    setDraft((prev) => ({
      ...prev,
      components: prev.components.map((c) => {
        if (c.id === componentId) {
          const subToClone = c.substances.find((s) => s.id === substanceId)
          if (!subToClone) return c

          const clonedSub = {
            ...subToClone,
            id: generateId(),
            name: `${subToClone.name} (Copy)`,
          }

          return {
            ...c,
            substances: [...c.substances, clonedSub],
          }
        }
        return c
      }),
    }))
  }

  const updateSubstance = (
    componentId: string,
    substanceId: string,
    updates: Partial<Substance>
  ) => {
    setDraft((prev) => ({
      ...prev,
      components: prev.components.map((c) => {
        if (c.id === componentId) {
          return {
            ...c,
            substances: c.substances.map((s) =>
              s.id === substanceId ? { ...s, ...updates } : s
            ),
          }
        }
        return c
      }),
    }))
  }

  const removeSubstance = (componentId: string, substanceId: string) => {
    setDraft((prev) => ({
      ...prev,
      components: prev.components.map((c) => {
        if (c.id === componentId) {
          return {
            ...c,
            substances: c.substances.filter((s) => s.id !== substanceId),
          }
        }
        return c
      }),
    }))
  }

  const importSubstancesFromExcel = (
    componentId: string,
    substances: {
      name: string
      casNumber: string
      percentage: number
      supplier: string
    }[]
  ) => {
    if (substances.length > 0) {
      setDraft((prev) => ({
        ...prev,
        components: prev.components.map((c) => {
          if (c.id === componentId) {
            return {
              ...c,
              substances: [
                ...c.substances,
                ...substances.map((s) => ({
                  id: generateId(),
                  name: s.name,
                  casNumber: s.casNumber,
                  percentage: s.percentage,
                  supplier: s.supplier,
                })),
              ],
            }
          }
          return c
        }),
      }))
    }
  }

  const clearDraft = () => {
    setDraft(defaultDraft)
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
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
  }
}
