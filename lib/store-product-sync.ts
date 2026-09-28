import type { Product } from "@/lib/data"
import { PRODUCT_STORAGE_KEY, type ProductMaster } from "@/lib/product-master"
import { promotionStatus, type Promotion } from "@/lib/promotions"

export function readProductMasterBySku() {
  if (typeof window === "undefined") return {} as Record<string, ProductMaster>
  try {
    const stored = localStorage.getItem(PRODUCT_STORAGE_KEY)
    return stored ? Object.fromEntries((JSON.parse(stored) as ProductMaster[]).map((item) => [item.sku, item])) as Record<string, ProductMaster> : {}
  } catch { return {} as Record<string, ProductMaster> }
}

export function applyMasterToStoreProduct(product: Product, master: ProductMaster | undefined, promotion: Promotion | null): Product {
  const basePrice = master?.price ?? product.price
  const baseTiers = master?.priceTiers ?? product.priceTiers
  const activePromotion = promotion && promotionStatus(promotion, baseTiers) === "vigente" ? promotion : null
  const price = activePromotion?.tiers.unit.salePrice ?? basePrice
  return {
    ...product,
    stock: master?.stock ?? product.stock,
    price,
    oldPrice: activePromotion?.regularPrice,
    badge: activePromotion ? activePromotion.kind === "outlet" ? "Outlet" : "Oferta" : product.badge === "Oferta" || product.badge === "Outlet" ? undefined : product.badge,
    priceTiers: {
      unit: { ...baseTiers.unit, unitPrice: price, ...(activePromotion?.tiers.unit.enabled ? { oldUnitPrice: baseTiers.unit.unitPrice } : {}) },
      inner: { ...baseTiers.inner, unitPrice: activePromotion?.tiers.inner.salePrice ?? baseTiers.inner.unitPrice, ...(activePromotion?.tiers.inner.enabled ? { oldUnitPrice: baseTiers.inner.unitPrice } : {}) },
      master: { ...baseTiers.master, unitPrice: activePromotion?.tiers.master.salePrice ?? baseTiers.master.unitPrice, ...(activePromotion?.tiers.master.enabled ? { oldUnitPrice: baseTiers.master.unitPrice } : {}) },
    },
  }
}
