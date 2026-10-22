"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import type { CreateOrderInput, FerreiaOrder } from "@/lib/orders"
import { createOrder as saveOrder, getAllOrders, getMyOrders, updateOrder as saveOrderUpdate } from "@/services/orders.service"
import { useCustomerSession } from "@/components/customer-session-provider"

type OrderUpdate = Partial<Pick<FerreiaOrder, "carrier" | "trackingNumber" | "estimatedFrom" | "estimatedTo" | "currentLocation" | "status" | "paymentStatus">>
type OrderContextValue = {
  orders: FerreiaOrder[]
  loading: boolean
  error: string
  createOrder: (input: CreateOrderInput) => Promise<{ order: FerreiaOrder | null; error: string | null }>
  updateOrder: (id: string, patch: OrderUpdate, detail?: string) => Promise<FerreiaOrder>
  findOrder: (id: string, email?: string, customerId?: string | null) => FerreiaOrder | null
}

const OrderContext = createContext<OrderContextValue | null>(null)

export function OrderProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user } = useCustomerSession()
  const [orders, setOrders] = useState<FerreiaOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!pathname.startsWith("/admin") || pathname === "/admin/login") return
    let active = true
    setLoading(true)
    getAllOrders()
      .then((result) => { if (active) { setOrders(result); setError("") } })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "No fue posible cargar los pedidos") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [pathname])
  useEffect(() => {
    if (pathname.startsWith("/admin") || !user) return
    let active = true
    setLoading(true)
    getMyOrders()
      .then((result) => { if (active) { setOrders(result.data); setError("") } })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "No fue posible cargar tus pedidos") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [pathname, user])

  async function createOrder(input: CreateOrderInput) {
    try {
      const result = await saveOrder({ customerId: input.customerId, guest: input.guest, customerName: input.customerName, document: input.document, email: input.email, phone: input.phone, items: input.items.map((item) => ({ productId: item.productId, quantity: item.quantity })), paymentMethod: input.paymentMethod, paymentStatus: input.paymentStatus, shippingMethod: input.shippingMethod, address: input.address, city: input.city, department: input.department })
      setOrders((previous) => [result.data, ...previous])
      return { order: result.data, error: null }
    } catch (error) {
      return { order: null, error: error instanceof Error ? error.message : "No fue posible crear el pedido" }
    }
  }

  async function updateOrder(id: string, patch: OrderUpdate, detail = "") {
    const result = await saveOrderUpdate(id, { ...patch, detail, notifyCustomer: true })
    setOrders((previous) => previous.map((order) => order.id === id ? result.data : order))
    return result.data
  }

  function findOrder(id: string, email = "", customerId: string | null = null) {
    const cleanId = id.trim().toUpperCase().replace(/^#/, "")
    const order = orders.find((item) => item.id.toUpperCase() === cleanId)
    if (!order) return null
    if (customerId && order.customerId === customerId) return order
    return order.email.toLowerCase() === email.trim().toLowerCase() ? order : null
  }

  const value = { orders, loading, error, createOrder, updateOrder, findOrder }
  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}

export function useOrders() {
  const context = useContext(OrderContext)
  if (!context) throw new Error("useOrders debe usarse dentro de OrderProvider")
  return context
}
