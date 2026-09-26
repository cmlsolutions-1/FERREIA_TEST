import type { MercadoPagoPayment } from "@/lib/mercado-pago"
import { apiRequest } from "@/services/api-client"
export async function getPayments(page = 1, limit = 100) { return apiRequest<MercadoPagoPayment[]>(`/api/payments?page=${page}&limit=${limit}`) }
