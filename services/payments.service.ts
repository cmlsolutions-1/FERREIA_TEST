import type { MercadoPagoCheckout, MercadoPagoConfiguration, MercadoPagoPayment, MercadoPagoSyncResult } from "@/lib/mercado-pago"
import { apiRequest } from "@/services/api-client"
export type MercadoPagoOrderStatus = { orderId: string; paymentStatus: string; paymentId: string | null; status: string | null }
export async function getPayments(page = 1, limit = 100) { return apiRequest<MercadoPagoPayment[]>(`/api/payments?page=${page}&limit=${limit}`) }
export async function getPaymentConfiguration() { return apiRequest<MercadoPagoConfiguration>("/api/payments/config") }
export async function createMercadoPagoCheckout(orderId: string, email: string) {
  return apiRequest<MercadoPagoCheckout>("/api/payments/checkout", { method: "POST", body: JSON.stringify({ orderId, email }) })
}
export async function getMercadoPagoOrderStatus(orderId: string, email: string) {
  return apiRequest<MercadoPagoOrderStatus>("/api/payments/order-status", { method: "POST", body: JSON.stringify({ orderId, email }) })
}
export async function synchronizeMercadoPagoPayment(paymentId: string) {
  return apiRequest<MercadoPagoSyncResult>("/api/payments/sync", { method: "POST", body: JSON.stringify({ paymentId }) })
}
export async function reconcileMercadoPagoPayments() {
  return apiRequest<{ processed: number }>("/api/payments/reconcile", { method: "POST" })
}
