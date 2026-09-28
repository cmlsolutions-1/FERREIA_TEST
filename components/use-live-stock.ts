"use client"

import { useEffect, useState } from "react"
import { INVENTORY_UPDATED_EVENT } from "@/lib/orders"
import type { ProductMaster } from "@/lib/product-master"
import { PRODUCT_UPDATED_EVENT } from "@/lib/cost-pricing"
import type { Product } from "@/lib/data"
import { getAllProducts, getProductById, type ProductRecord } from "@/services/products.service"

function toMaster(product: ProductRecord): ProductMaster {
  return { id: product.sku, reference: product.reference, supplierReference: product.supplierReference, name: product.name, sku: product.sku, barcodes: product.barcodes, line: product.line, brand: product.brand, group: product.group, subgroup: product.subgroup, packaging: product.packaging, priceTiers: product.basePriceTiers ?? product.priceTiers, unit: product.unit, weight: product.weight, cost: product.cost, price: product.basePrice, taxRate: product.taxRate, warehouse: product.warehouse, stock: product.stock, stockMin: product.stockMin, stockMax: product.stockMax, images: product.images, suppliers: product.suppliers, characteristics: product.characteristics, active: product.active, markupPercent: product.markupPercent, costReview: product.costReview }
}

export function useLiveProductMaster() {
  const [masterBySku, setMasterBySku] = useState<Record<string, ProductMaster>>({})
  useEffect(() => {
    let active = true
    const load = () => getAllProducts().then((products) => { if (active) setMasterBySku(Object.fromEntries(products.map((product) => [product.sku, toMaster(product)]))) }).catch(() => {})
    void load()
    window.addEventListener(PRODUCT_UPDATED_EVENT, load)
    window.addEventListener(INVENTORY_UPDATED_EVENT, load)
    return () => { active = false; window.removeEventListener(PRODUCT_UPDATED_EVENT, load); window.removeEventListener(INVENTORY_UPDATED_EVENT, load) }
  }, [])
  return masterBySku
}

export function useLiveInventoryStock() {
  const masters = useLiveProductMaster()
  return Object.fromEntries(Object.entries(masters).map(([sku, product]) => [sku, product.stock])) as Record<string, number>
}

export function useLiveStock(sku: string, fallback: number) {
  const [stock, setStock] = useState(fallback)
  useEffect(() => {
    let active = true
    getProductById(sku).then((result) => { if (active) setStock(result.data.stock) }).catch(() => {})
    return () => { active = false }
  }, [sku])
  return stock
}

export function useLiveProduct(product: Product) {
  const [current, setCurrent] = useState(product)
  useEffect(() => {
    let active = true
    const load = () => getProductById(product.id).then((result) => { if (active) setCurrent(result.data as Product) }).catch(() => {})
    void load()
    window.addEventListener(PRODUCT_UPDATED_EVENT, load)
    window.addEventListener(INVENTORY_UPDATED_EVENT, load)
    return () => { active = false; window.removeEventListener(PRODUCT_UPDATED_EVENT, load); window.removeEventListener(INVENTORY_UPDATED_EVENT, load) }
  }, [product.id])
  return current
}
