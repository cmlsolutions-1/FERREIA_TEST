import { apiRequest } from "@/services/api-client"

export type GiftTier = {
  id: string
  minSubtotal: number
  maxSubtotal: number | null
  stepAmount: number
  productId: string
  product: { id: string; sku: string; reference: string; name: string; image: string; stock: number; active: boolean }
  active: boolean
  createdAt: string
  updatedAt: string
}

export type GiftTierInput = Pick<GiftTier, "minSubtotal" | "maxSubtotal" | "stepAmount" | "productId" | "active">
export type GiftQuote = { status: "none" | "progress" | "earned"; tier: GiftTier | null; target: number | null; remaining: number | null }

export async function getGiftTiers(admin = false) { return apiRequest<GiftTier[]>(`/api/gifts${admin ? "?admin=true" : ""}`) }
export async function getGiftQuote(subtotal: number) { return apiRequest<GiftQuote>(`/api/gifts/quote?subtotal=${encodeURIComponent(String(subtotal))}`) }
export async function createGiftTier(input: GiftTierInput) { return apiRequest<GiftTier>("/api/gifts", { method: "POST", body: JSON.stringify(input) }) }
export async function updateGiftTier(id: string, input: GiftTierInput) { return apiRequest<GiftTier>(`/api/gifts/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(input) }) }
export async function deleteGiftTier(id: string) { return apiRequest<{ deleted: boolean }>(`/api/gifts/${encodeURIComponent(id)}`, { method: "DELETE" }) }
