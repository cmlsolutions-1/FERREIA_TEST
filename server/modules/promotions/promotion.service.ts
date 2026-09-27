import type { z } from "zod"
import { promotionRepository } from "@/server/modules/promotions/promotion.repository"
import { promotionSchema } from "@/server/modules/promotions/promotion.schema"
import { discountedPrice, resolvePromotionPrices } from "@/server/modules/promotions/promotion-pricing"
import { ApiError } from "@/server/shared/api-error"

type Record = Awaited<ReturnType<typeof promotionRepository.list>>[number]
const number = (value: { toNumber(): number }) => value.toNumber()
function basePrices(product: Record["product"]) {
  const tiers = Object.fromEntries(product.priceTiers.map((tier) => [tier.kind, number(tier.unitPrice)]))
  return { unit: number(product.price), inner: tiers.inner ?? number(product.price), master: tiers.master ?? number(product.price) }
}
function dto(item: Record) {
  const base = basePrices(item.product)
  const prices = resolvePromotionPrices(item, base).prices
  return {
    sku: item.product.sku, kind: item.kind, regularPrice: base.unit, salePrice: prices.unit, basePrice: number(item.basePrice),
    basePrices: { unit: number(item.basePrice), inner: number(item.baseInnerPrice), master: number(item.baseMasterPrice) },
    tiers: {
      unit: { enabled: item.unitEnabled, percent: number(item.unitDiscount), regularPrice: base.unit, salePrice: prices.unit },
      inner: { enabled: item.innerEnabled, percent: number(item.innerDiscount), regularPrice: base.inner, salePrice: prices.inner },
      master: { enabled: item.masterEnabled, percent: number(item.masterDiscount), regularPrice: base.master, salePrice: prices.master },
    },
    startsAt: item.startsAt?.toISOString().slice(0, 10) ?? "", endsAt: item.endsAt?.toISOString().slice(0, 10) ?? "", active: item.active, updatedAt: item.updatedAt.toISOString(),
  }
}
export const promotionService = {
  async list() { return (await promotionRepository.list()).map(dto) },
  async save(input: z.infer<typeof promotionSchema>) {
    const product = await promotionRepository.product(input.sku)
    if (!product || !product.active) throw new ApiError(404, "PRODUCT_NOT_FOUND", "El producto no está disponible")
    const base = basePrices(product)
    const prices = {
      unit: input.tiers.unit.enabled ? discountedPrice(base.unit, input.tiers.unit.percent) : base.unit,
      inner: input.tiers.inner.enabled ? discountedPrice(base.inner, input.tiers.inner.percent) : base.inner,
      master: input.tiers.master.enabled ? discountedPrice(base.master, input.tiers.master.percent) : base.master,
    }
    if (!(prices.unit >= prices.inner && prices.inner >= prices.master)) throw new ApiError(422, "INVALID_PRICE_HIERARCHY", `La promoción debe conservar Unidad (${prices.unit}) ≥ Inner (${prices.inner}) ≥ Master (${prices.master})`)
    return dto(await promotionRepository.save(product.id, {
      kind: input.kind, regularPrice: base.unit, salePrice: prices.unit, basePrice: base.unit,
      baseInnerPrice: base.inner, baseMasterPrice: base.master,
      unitEnabled: input.tiers.unit.enabled, unitDiscount: input.tiers.unit.enabled ? input.tiers.unit.percent : 0,
      innerEnabled: input.tiers.inner.enabled, innerDiscount: input.tiers.inner.enabled ? input.tiers.inner.percent : 0,
      masterEnabled: input.tiers.master.enabled, masterDiscount: input.tiers.master.enabled ? input.tiers.master.percent : 0,
      startsAt: input.startsAt ? new Date(input.startsAt) : null, endsAt: input.endsAt ? new Date(input.endsAt) : null, active: input.active,
    }))
  },
  async remove(sku: string) { const product = await promotionRepository.product(sku); if (!product) throw new ApiError(404, "PRODUCT_NOT_FOUND", "No fue posible encontrar el producto"); const result = await promotionRepository.remove(product.id); if (!result.count) throw new ApiError(404, "PROMOTION_NOT_FOUND", "No fue posible encontrar la promoción") },
}
