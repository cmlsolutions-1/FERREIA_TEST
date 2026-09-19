"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  INITIAL_ORDERS,
  INVENTORY_UPDATED_EVENT,
  ORDER_STORAGE_KEY,
  type CreateOrderInput,
  type FerreiaOrder,
  type OrderItem,
  type OrderStatus,
} from "@/lib/orders"
import { initialProductMaster, PRODUCT_STORAGE_KEY, type ProductMaster } from "@/lib/product-master"
import { readShippingSettings } from "@/lib/shipping"

type OrderUpdate = Partial<Pick<FerreiaOrder, "carrier" | "trackingNumber" | "estimatedFrom" | "estimatedTo" | "currentLocation" | "status" | "paymentStatus">>

type OrderContextValue = {
  orders: FerreiaOrder[]
  createOrder: (input: CreateOrderInput) => { order: FerreiaOrder | null; error: string | null }
  updateOrder: (id: string, patch: OrderUpdate, detail?: string) => void
  findOrder: (id: string, email?: string, customerId?: string | null) => FerreiaOrder | null
}

const OrderContext = createContext<OrderContextValue | null>(null)

function readInventory() {
  try {
    const stored = localStorage.getItem(PRODUCT_STORAGE_KEY)
    return stored ? JSON.parse(stored) as ProductMaster[] : structuredClone(initialProductMaster)
  } catch {
    return structuredClone(initialProductMaster)
  }
}

function inventoryQuantities(items: OrderItem[]) {
  return items.reduce<Record<string, number>>((result, item) => {
    result[item.sku] = (result[item.sku] ?? 0) + item.quantity
    return result
  }, {})
}

function adjustInventory(items: OrderItem[], direction: -1 | 1) {
  const products = readInventory()
  const quantities = inventoryQuantities(items)

  if (direction === -1) {
    const shortage = Object.entries(quantities).find(([sku, quantity]) => {
      const product = products.find((item) => item.sku === sku)
      return !product || product.stock < quantity
    })
    if (shortage) {
      const product = products.find((item) => item.sku === shortage[0])
      return `No hay existencias suficientes de ${product?.name ?? shortage[0]}. Disponible: ${product?.stock ?? 0}.`
    }
  }

  const updated = products.map((product) => {
    const quantity = quantities[product.sku] ?? 0
    return quantity ? { ...product, stock: Math.max(0, product.stock + quantity * direction) } : product
  })
  localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(updated))
  window.dispatchEvent(new CustomEvent(INVENTORY_UPDATED_EVENT))
  return null
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result.toISOString().slice(0, 10)
}

function nextOrderId(orders: FerreiaOrder[]) {
  const next = Math.max(10231, ...orders.map((order) => Number(order.id.replace(/\D/g, "")) || 0)) + 1
  return `FE-${next}`
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<FerreiaOrder[]>(INITIAL_ORDERS)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ORDER_STORAGE_KEY)
      if (stored) setOrders(JSON.parse(stored) as FerreiaOrder[])
      else localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(INITIAL_ORDERS))
    } catch {
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(INITIAL_ORDERS))
    }

    function syncOrders(event: StorageEvent) {
      if (event.key === ORDER_STORAGE_KEY && event.newValue) setOrders(JSON.parse(event.newValue) as FerreiaOrder[])
    }
    window.addEventListener("storage", syncOrders)
    return () => window.removeEventListener("storage", syncOrders)
  }, [])

  function persist(next: FerreiaOrder[]) {
    setOrders(next)
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(next))
  }

  function createOrder(input: CreateOrderInput) {
    const inventoryError = adjustInventory(input.items, -1)
    if (inventoryError) return { order: null, error: inventoryError }

    const createdAt = new Date()
    const shippingSettings = readShippingSettings()
    const deliveryMethod = input.shippingMethod === "Express" ? shippingSettings.express : shippingSettings.standard
    const status: OrderStatus = input.paymentStatus === "Pagado" ? "Pago confirmado" : "Pedido confirmado"
    const id = nextOrderId(orders)
    const timeline: FerreiaOrder["timeline"] = [
      {
        id: `EV-${Date.now()}-order`,
        status: "Pedido confirmado" as const,
        title: "Pedido recibido",
        detail: "FERREIA recibió la compra y descontó las unidades del inventario.",
        location: "FERREIA · Bogotá",
        occurredAt: createdAt.toISOString(),
      },
    ]
    if (input.paymentStatus === "Pagado") {
      timeline.push({
        id: `EV-${Date.now()}-payment`,
        status: "Pago confirmado",
        title: "Pago confirmado",
        detail: "El pago de la compra fue aprobado.",
        location: "FERREIA · Bogotá",
        occurredAt: createdAt.toISOString(),
      })
    }

    const order: FerreiaOrder = {
      ...input,
      id,
      createdAt: createdAt.toISOString(),
      carrier: "Por asignar",
      trackingNumber: "",
      estimatedFrom: addDays(createdAt, deliveryMethod.minDays),
      estimatedTo: addDays(createdAt, deliveryMethod.maxDays),
      currentLocation: "Pedido recibido en FERREIA",
      status,
      timeline,
      inventoryApplied: true,
      inventoryRestored: false,
    }
    persist([order, ...orders])
    return { order, error: null }
  }

  function updateOrder(id: string, patch: OrderUpdate, detail = "") {
    let restored = false
    const current = orders.find((order) => order.id === id)
    if (!current) return
    if (patch.status === "Cancelado" && current.status !== "Cancelado" && current.inventoryApplied && !current.inventoryRestored) {
      adjustInventory(current.items, 1)
      restored = true
    }

    const statusChanged = patch.status && patch.status !== current.status
    const locationChanged = patch.currentLocation && patch.currentLocation !== current.currentLocation
    const next = orders.map((order) => {
      if (order.id !== id) return order
      const status = patch.status ?? order.status
      const shouldAddEvent = Boolean(statusChanged || locationChanged || detail.trim())
      return {
        ...order,
        ...patch,
        inventoryRestored: restored ? true : order.inventoryRestored,
        paymentStatus: status === "Cancelado" && order.paymentStatus === "Pagado" ? "Reembolsado" : patch.paymentStatus ?? order.paymentStatus,
        timeline: shouldAddEvent
          ? [...order.timeline, {
              id: `EV-${Date.now()}`,
              status,
              title: status,
              detail: detail.trim() || `El pedido cambió al estado ${status.toLowerCase()}.`,
              location: patch.currentLocation || order.currentLocation,
              occurredAt: new Date().toISOString(),
            }]
          : order.timeline,
      }
    })
    persist(next)
  }

  function findOrder(id: string, email = "", customerId: string | null = null) {
    const cleanId = id.trim().toUpperCase().replace(/^#/, "")
    const order = orders.find((item) => item.id.toUpperCase() === cleanId)
    if (!order) return null
    if (customerId && order.customerId === customerId) return order
    return order.email.toLowerCase() === email.trim().toLowerCase() ? order : null
  }

  const value = useMemo(() => ({ orders, createOrder, updateOrder, findOrder }), [orders])
  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}

export function useOrders() {
  const context = useContext(OrderContext)
  if (!context) throw new Error("useOrders debe usarse dentro de OrderProvider")
  return context
}
