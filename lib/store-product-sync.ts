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
  const activePromotion = promotion && promotionStatus(promotion, basePrice) === "vigente" ? promotion : null
  const price = activePromotion?.salePrice ?? basePrice
  return {
    ...product,
    stock: master?.stock ?? product.stock,
    price,
    oldPrice: activePromotion?.regularPrice,
    badge: activePromotion ? activePromotion.kind === "outlet" ? "Outlet" : "Oferta" : product.badge === "Oferta" || product.badge === "Outlet" ? undefined : product.badge,
    priceTiers: {
      unit: { ...product.priceTiers.unit, unitPrice: price },
      inner: master?.priceTiers.inner ?? product.priceTiers.inner,
      master: master?.priceTiers.master ?? product.priceTiers.master,
    },
  }
}
