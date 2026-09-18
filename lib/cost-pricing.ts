export const DEFAULT_MARKUP_PERCENT = 30
export const PRICING_SETTINGS_KEY = "ferreia-admin-pricing-settings-v1"
export const PRODUCT_UPDATED_EVENT = "ferreia:products-updated"

// Ganancia porcentual sobre el costo: (venta - costo) / costo.
export function markupPercent(cost: number, price: number) {
  return cost > 0 ? ((price - cost) / cost) * 100 : 0
}

export function salePriceFromMarkup(cost: number, percent: number) {
  return Math.round(cost * (1 + percent / 100))
}

export function unitProfit(cost: number, price: number) {
  return price - cost
}

export function readSuggestedMarkup() {
  if (typeof window === "undefined") return DEFAULT_MARKUP_PERCENT
  try {
    const stored = localStorage.getItem(PRICING_SETTINGS_KEY)
    if (stored === null) return DEFAULT_MARKUP_PERCENT
    const value = Number(stored)
    return Number.isFinite(value) && value >= 0 && value <= 1000 ? value : DEFAULT_MARKUP_PERCENT
  } catch {
    return DEFAULT_MARKUP_PERCENT
  }
}

export function formatPercent(value: number) {
  return `${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 }).format(value)}%`
}
