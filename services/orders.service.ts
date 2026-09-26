import type { FerreiaOrder } from "@/lib/orders"
import { apiRequest } from "@/services/api-client"
export async function getOrders(page = 1, limit = 100) { return apiRequest<FerreiaOrder[]>(`/api/orders?page=${page}&limit=${limit}`) }
export async function getMyOrders() { return apiRequest<FerreiaOrder[]>("/api/orders/mine") }
export async function getOrderById(id: string, email?: string) { return apiRequest<FerreiaOrder>(`/api/orders/${encodeURIComponent(id)}${email ? `?email=${encodeURIComponent(email)}` : ""}`) }
export async function createOrder(input: unknown) { return apiRequest<FerreiaOrder>("/api/orders", { method: "POST", body: JSON.stringify(input) }) }
export async function updateOrder(id: string, patch: unknown) { return apiRequest<FerreiaOrder>(`/api/orders/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) }) }
