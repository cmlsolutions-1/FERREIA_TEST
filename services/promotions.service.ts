import type { Promotion } from "@/lib/promotions"
import { apiRequest } from "@/services/api-client"
export async function getPromotions() { return apiRequest<Promotion[]>("/api/promotions") }
export async function savePromotion(input: Omit<Promotion, "basePrice" | "updatedAt">) { return apiRequest<Promotion>("/api/promotions", { method: "POST", body: JSON.stringify(input) }) }
export async function removePromotion(sku: string) { return apiRequest<{ deleted: boolean }>(`/api/promotions/${encodeURIComponent(sku)}`, { method: "DELETE" }) }
