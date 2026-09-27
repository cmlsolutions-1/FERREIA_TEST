import { PRODUCTS, type ProductPriceTiers } from "@/lib/data"

export const PROMOTIONS_UPDATED_EVENT = "ferreia:promotions-updated"

export type PromotionKind = "promocion" | "outlet"
export type PromotionTierKey = "unit" | "inner" | "master"
export type PromotionTier = { enabled: boolean; percent: number; regularPrice: number; salePrice: number }
export type Promotion = {
  sku: string
  kind: PromotionKind
  regularPrice: number
  salePrice: number
  basePrice: number
  basePrices: Record<PromotionTierKey, number>
  tiers: Record<PromotionTierKey, PromotionTier>
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
  basePrices: { unit: product.price, inner: product.priceTiers.inner.unitPrice, master: product.priceTiers.master.unitPrice },
  tiers: {
    unit: { enabled: true, percent: Math.round((1 - product.price / product.oldPrice!) * 100), regularPrice: product.price, salePrice: product.price },
    inner: { enabled: false, percent: 0, regularPrice: product.priceTiers.inner.unitPrice, salePrice: product.priceTiers.inner.unitPrice },
    master: { enabled: false, percent: 0, regularPrice: product.priceTiers.master.unitPrice, salePrice: product.priceTiers.master.unitPrice },
  },
  startsAt: "",
  endsAt: "",
  active: true,
  updatedAt: "",
}))

export function promotionBySku(promotions: Promotion[]) {
  return Object.fromEntries(promotions.map((promotion) => [promotion.sku, promotion])) as Record<string, Promotion>
}

export function promotionStatus(promotion: Promotion, currentPrices: ProductPriceTiers, today = new Date().toISOString().slice(0, 10)) {
  if (currentPrices.unit.unitPrice !== promotion.basePrices.unit || currentPrices.inner.unitPrice !== promotion.basePrices.inner || currentPrices.master.unitPrice !== promotion.basePrices.master) return "revisar" as const
  if (!promotion.active) return "inactiva" as const
  if (!Object.values(promotion.tiers).some((tier) => tier.enabled && tier.percent > 0)) return "invalida" as const
  if (!(promotion.tiers.unit.salePrice >= promotion.tiers.inner.salePrice && promotion.tiers.inner.salePrice >= promotion.tiers.master.salePrice)) return "invalida" as const
  if (promotion.startsAt && today < promotion.startsAt) return "programada" as const
  if (promotion.endsAt && today > promotion.endsAt) return "vencida" as const
  return "vigente" as const
}

export function discountPercent(promotion: Promotion, tier: PromotionTierKey = "unit") {
  return promotion.tiers[tier].percent
}
