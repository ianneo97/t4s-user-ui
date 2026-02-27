const ORDERS_STORAGE_KEY = 't4s-demo-orders-v2'

export interface CachedOrderItem {
  id: string
  name: string
  description?: string
  quantity: number
  unitPrice: number
  productId?: string // Null until linked via approval
  status: 'PENDING' | 'LINKED'
}

export interface CachedOrder {
  id: string
  orderNumber: string
  type: 'PO' | 'SO'
  workspaceId: string // The workspace that owns this view of the order
  targetWorkspaceId: string // The counterpart workspace
  supplierId?: string // Link to supplier for POs
  supplierName?: string
  currency?: string
  shipToAddress?: string
  orderNature?: string
  shippedOn?: string
  items: CachedOrderItem[]
  createdAt: string
  updatedAt: string
}

function getDefaultOrders(): CachedOrder[] {
  return []
}

export function getCachedOrders(): CachedOrder[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(ORDERS_STORAGE_KEY)
  if (!stored) {
    const defaultOrders = getDefaultOrders()
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(defaultOrders))
    return defaultOrders
  }
  return JSON.parse(stored)
}

export function saveCachedOrders(orders: CachedOrder[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders))
}

export function linkProductToOrderItem(
  orderId: string,
  itemId: string,
  productId: string
) {
  const orders = getCachedOrders()

  // Update the PO side
  const poIndex = orders.findIndex(
    (o) => o.id === orderId || o.items.some((i) => i.id === itemId)
  )
  if (poIndex !== -1) {
    const itemIndex = orders[poIndex].items.findIndex((i) => i.id === itemId)
    if (itemIndex !== -1) {
      orders[poIndex].items[itemIndex].productId = productId
      orders[poIndex].items[itemIndex].status = 'LINKED'
    }
  }

  // Update the SO side (since they share the same item IDs for simplicity in this demo)
  const soIndex = orders.findIndex(
    (o) => o.type === 'SO' && o.items.some((i) => i.id === itemId)
  )
  if (soIndex !== -1) {
    const itemIndex = orders[soIndex].items.findIndex((i) => i.id === itemId)
    if (itemIndex !== -1) {
      orders[soIndex].items[itemIndex].productId = productId
      orders[soIndex].items[itemIndex].status = 'LINKED'
    }
  }

  saveCachedOrders(orders)
}
