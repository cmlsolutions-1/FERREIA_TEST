import type { Promotion } from "@/lib/promotions"
import { apiRequest } from "@/services/api-client"

type PromotionInput = Pick<Promotion, "sku" | "kind" | "tiers" | "startsAt" | "endsAt" | "active">

export async function getPromotions() { return apiRequest<Promotion[]>("/api/promotions") }
export async function savePromotion(input: PromotionInput) {
  const { sku, kind, tiers, startsAt, endsAt, active } = input
  return apiRequest<Promotion>("/api/promotions", { method: "POST", body: JSON.stringify({ sku, kind, tiers: Object.fromEntries(Object.entries(tiers).map(([key, tier]) => [key, { enabled: tier.enabled, percent: tier.percent }])), startsAt, endsAt, active }) })
}
export async function removePromotion(sku: string) { return apiRequest<{ deleted: boolean }>(`/api/promotions/${encodeURIComponent(sku)}`, { method: "DELETE" }) }
