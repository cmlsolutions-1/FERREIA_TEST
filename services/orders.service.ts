import type { FerreiaOrder } from "@/lib/orders"
import { apiRequest } from "@/services/api-client"

export type OrderFilters = { page?: number; limit?: number; status?: string; search?: string }

function query(filters: OrderFilters) {
  return new URLSearchParams(Object.entries(filters)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => [key, String(value)]))
}

export async function getOrders(filters: OrderFilters = {}, signal?: AbortSignal) {
  return apiRequest<FerreiaOrder[]>(`/api/orders?${query(filters)}`, { signal })
}

export async function getAllOrders(filters: Omit<OrderFilters, "page" | "limit"> = {}) {
  const orders: FerreiaOrder[] = []
  for (let page = 1; ; page++) {
    const response = await getOrders({ ...filters, page, limit: 100 })
    orders.push(...response.data)
    if (!response.meta?.hasNextPage) return orders
  }
}

export async function getMyOrders() { return apiRequest<FerreiaOrder[]>("/api/orders/mine") }
export async function getOrderById(id: string, email?: string) { return apiRequest<FerreiaOrder>(`/api/orders/${encodeURIComponent(id)}${email ? `?email=${encodeURIComponent(email)}` : ""}`) }
export async function createOrder(input: unknown) { return apiRequest<FerreiaOrder>("/api/orders", { method: "POST", body: JSON.stringify(input) }) }
export async function updateOrder(id: string, patch: unknown) { return apiRequest<FerreiaOrder>(`/api/orders/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) }) }
