import { PRODUCTS } from "@/lib/data"

export const PROMOTIONS_STORAGE_KEY = "ferreia-promotions-v1"
export const PROMOTIONS_UPDATED_EVENT = "ferreia:promotions-updated"

export type PromotionKind = "promocion" | "outlet"
export type Promotion = {
  sku: string
  kind: PromotionKind
  regularPrice: number
  salePrice: number
  basePrice: number
  startsAt: string
  endsAt: string
  active: boolean
  updatedAt: string
}

export const initialPromotions: Promotion[] = PRODUCTS.filter((product) => product.oldPrice && product.oldPrice > product.price).map((product) => ({
  sku: product.sku,
  kind: "promocion",
  regularPrice: product.oldPrice!,
  salePrice: product.price,
  basePrice: product.price,
  startsAt: "",
  endsAt: "",
  active: true,
  updatedAt: "",
}))

export function readPromotions(): Promotion[] {
  if (typeof window === "undefined") return initialPromotions
  try {
    const raw = localStorage.getItem(PROMOTIONS_STORAGE_KEY)
    return raw === null ? initialPromotions : JSON.parse(raw) as Promotion[]
  } catch { return initialPromotions }
}

export function promotionBySku(promotions: Promotion[]) {
  return Object.fromEntries(promotions.map((promotion) => [promotion.sku, promotion])) as Record<string, Promotion>
}

export function promotionStatus(promotion: Promotion, currentBasePrice: number, today = new Date().toISOString().slice(0, 10)) {
  if (currentBasePrice !== promotion.basePrice) return "revisar" as const
  if (!promotion.active) return "inactiva" as const
  if (!(promotion.salePrice > 0 && promotion.regularPrice > promotion.salePrice)) return "invalida" as const
  if (promotion.startsAt && today < promotion.startsAt) return "programada" as const
  if (promotion.endsAt && today > promotion.endsAt) return "vencida" as const
  return "vigente" as const
}

export function discountPercent(promotion: Promotion) {
  return Math.round((1 - promotion.salePrice / promotion.regularPrice) * 100)
}
