"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { Product } from "@/lib/data"
import { calculateTieredPrice } from "@/lib/pricing"
import { PRODUCT_UPDATED_EVENT } from "@/lib/cost-pricing"
import { applyMasterToStoreProduct, readProductMasterBySku } from "@/lib/store-product-sync"

export type CartLine = {
  product: Product
  qty: number
}

type CartContextValue = {
  lines: CartLine[]
  count: number
  subtotal: number
  addItem: (product: Product, qty?: number) => void
  removeItem: (id: string) => void
  setQty: (id: string, qty: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)
const CART_STORAGE_KEY = "ferreia-cart-v1"

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        const masters = readProductMasterBySku()
        setLines((JSON.parse(stored) as CartLine[]).map((line) => ({ ...line, product: applyMasterToStoreProduct(line.product, masters[line.product.sku]) })))
      }
    } finally { setHydrated(true) }
  }, [])

  useEffect(() => {
    if (hydrated) localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines))
  }, [hydrated, lines])

  useEffect(() => {
    const updatePrices = () => {
      const masters = readProductMasterBySku()
      setLines((previous) => previous.map((line) => ({ ...line, product: applyMasterToStoreProduct(line.product, masters[line.product.sku]) })))
    }
    window.addEventListener(PRODUCT_UPDATED_EVENT, updatePrices)
    return () => window.removeEventListener(PRODUCT_UPDATED_EVENT, updatePrices)
  }, [])

  function addItem(product: Product, qty = 1) {
    const masters = readProductMasterBySku()
    const currentProduct = applyMasterToStoreProduct(product, masters[product.sku])
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === currentProduct.id)
      if (existing) {
        return prev.map((l) =>
          l.product.id === currentProduct.id ? { ...l, product: currentProduct, qty: l.qty + qty } : l,
        )
      }
      return [...prev, { product: currentProduct, qty }]
    })
  }

  function removeItem(id: string) {
    setLines((prev) => prev.filter((l) => l.product.id !== id))
  }

  function setQty(id: string, qty: number) {
    setLines((prev) =>
      prev
        .map((l) => (l.product.id === id ? { ...l, qty: Math.max(1, qty) } : l))
        .filter((l) => l.qty > 0),
    )
  }

  function clear() {
    setLines([])
  }

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((acc, l) => acc + l.qty, 0)
    const subtotal = lines.reduce((acc, l) => acc + calculateTieredPrice(l.product, l.qty).total, 0)
    return { lines, count, subtotal, addItem, removeItem, setQty, clear }
  }, [lines])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider")
  return ctx
}
