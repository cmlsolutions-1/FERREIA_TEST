import type { Product } from "@/lib/data"
import { PRODUCT_STORAGE_KEY, type ProductMaster } from "@/lib/product-master"

export function readProductMasterBySku() {
  if (typeof window === "undefined") return {} as Record<string, ProductMaster>
  try {
    const stored = localStorage.getItem(PRODUCT_STORAGE_KEY)
    return stored ? Object.fromEntries((JSON.parse(stored) as ProductMaster[]).map((item) => [item.sku, item])) as Record<string, ProductMaster> : {}
  } catch { return {} as Record<string, ProductMaster> }
}

export function applyMasterToStoreProduct(product: Product, master?: ProductMaster): Product {
  if (!master) return product
  const price = master.price
  const priceChanged = price !== product.price
  return {
    ...product,
    stock: master.stock,
    price,
    oldPrice: !priceChanged && product.oldPrice && product.oldPrice > price ? product.oldPrice : undefined,
    badge: priceChanged && product.badge === "Oferta" ? undefined : product.badge,
    priceTiers: {
      unit: { ...product.priceTiers.unit, unitPrice: price },
      inner: { ...product.priceTiers.inner, unitPrice: Math.round(price * 0.9) },
      master: { ...product.priceTiers.master, unitPrice: Math.round(price * 0.85) },
    },
  }
}
