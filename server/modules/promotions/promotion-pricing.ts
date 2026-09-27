type Numeric = number | { toNumber(): number }
type TierKey = "unit" | "inner" | "master"
type BasePrices = Record<TierKey, number>
type PromotionConfiguration = {
  active: boolean
  startsAt: Date | null
  endsAt: Date | null
  basePrice: Numeric
  baseInnerPrice: Numeric
  baseMasterPrice: Numeric
  salePrice: Numeric
  unitEnabled: boolean
  unitDiscount: Numeric
  innerEnabled: boolean
  innerDiscount: Numeric
  masterEnabled: boolean
  masterDiscount: Numeric
}

const number = (value: Numeric) => typeof value === "number" ? value : value.toNumber()
export const discountedPrice = (price: number, percent: number) => Math.round(price * (1 - percent / 100) * 100) / 100

export function resolvePromotionPrices(promotion: PromotionConfiguration | null | undefined, base: BasePrices, today = new Date()) {
  if (!promotion) return { active: false, hierarchyValid: true, prices: base, enabled: { unit: false, inner: false, master: false } }
  const enabled = { unit: promotion.unitEnabled, inner: promotion.innerEnabled, master: promotion.masterEnabled }
  const configured = (Object.keys(enabled) as TierKey[]).some((key) => enabled[key])
  const snapshotsMatch = number(promotion.basePrice) === base.unit && number(promotion.baseInnerPrice) === base.inner && number(promotion.baseMasterPrice) === base.master
  const percentagesValid = (!enabled.unit || number(promotion.unitDiscount) > 0) && (!enabled.inner || number(promotion.innerDiscount) > 0) && (!enabled.master || number(promotion.masterDiscount) > 0)
  const prices = {
    unit: enabled.unit ? number(promotion.salePrice) : base.unit,
    inner: enabled.inner ? discountedPrice(base.inner, number(promotion.innerDiscount)) : base.inner,
    master: enabled.master ? discountedPrice(base.master, number(promotion.masterDiscount)) : base.master,
  }
  const hierarchyValid = prices.unit >= prices.inner && prices.inner >= prices.master
  const scheduled = (!promotion.startsAt || promotion.startsAt <= today) && (!promotion.endsAt || promotion.endsAt >= today)
  return { active: promotion.active && configured && snapshotsMatch && percentagesValid && hierarchyValid && scheduled, hierarchyValid, prices, enabled }
}
