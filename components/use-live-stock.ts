"use client"

import { useEffect, useState } from "react"
import { INVENTORY_UPDATED_EVENT } from "@/lib/orders"
import { PRODUCT_STORAGE_KEY, type ProductMaster } from "@/lib/product-master"
import { PRODUCT_UPDATED_EVENT } from "@/lib/cost-pricing"
import { applyMasterToStoreProduct, readProductMasterBySku } from "@/lib/store-product-sync"
import type { Product } from "@/lib/data"

function readStockBySku() {
  try {
    const stored = localStorage.getItem(PRODUCT_STORAGE_KEY)
    if (!stored) return {}
    return Object.fromEntries(
      (JSON.parse(stored) as ProductMaster[]).map((product) => [product.sku, product.stock]),
    )
  } catch {
    return {}
  }
}

export function useLiveInventoryStock() {
  const [stockBySku, setStockBySku] = useState<Record<string, number>>({})

  useEffect(() => {
    function load() {
      setStockBySku(readStockBySku())
    }
    load()
    window.addEventListener(INVENTORY_UPDATED_EVENT, load)
    window.addEventListener(PRODUCT_UPDATED_EVENT, load)
    window.addEventListener("storage", load)
    return () => {
      window.removeEventListener(INVENTORY_UPDATED_EVENT, load)
      window.removeEventListener(PRODUCT_UPDATED_EVENT, load)
      window.removeEventListener("storage", load)
    }
  }, [])

  return stockBySku
}

export function useLiveStock(sku: string, fallback: number) {
  const [stock, setStock] = useState(fallback)

  useEffect(() => {
    function load() {
      try {
        const stored = localStorage.getItem(PRODUCT_STORAGE_KEY)
        if (!stored) { setStock(fallback); return }
        const product = (JSON.parse(stored) as ProductMaster[]).find((item) => item.sku === sku)
        setStock(product?.stock ?? fallback)
      } catch { setStock(fallback) }
    }
    load()
    window.addEventListener(INVENTORY_UPDATED_EVENT, load)
    window.addEventListener(PRODUCT_UPDATED_EVENT, load)
    window.addEventListener("storage", load)
    return () => { window.removeEventListener(INVENTORY_UPDATED_EVENT, load); window.removeEventListener(PRODUCT_UPDATED_EVENT, load); window.removeEventListener("storage", load) }
  }, [fallback, sku])

  return stock
}

export function useLiveProductMaster() {
  const [masterBySku, setMasterBySku] = useState<Record<string, ProductMaster>>({})
  useEffect(() => {
    const load = () => setMasterBySku(readProductMasterBySku())
    load()
    window.addEventListener(PRODUCT_UPDATED_EVENT, load)
    window.addEventListener(INVENTORY_UPDATED_EVENT, load)
    window.addEventListener("storage", load)
    return () => { window.removeEventListener(PRODUCT_UPDATED_EVENT, load); window.removeEventListener(INVENTORY_UPDATED_EVENT, load); window.removeEventListener("storage", load) }
  }, [])
  return masterBySku
}

export function useLiveProduct(product: Product) {
  const masterBySku = useLiveProductMaster()
  return applyMasterToStoreProduct(product, masterBySku[product.sku])
}
