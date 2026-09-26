import { apiRequest } from "@/services/api-client"

export type StockRow = {
  id: string; reference: string; sku: string; name: string; brand: string
  warehouseId: string | null; warehouse: string; stock: number; stockMin: number
  stockMax: number; cost: number; active: boolean
}

export type StockSummary = {
  availableUnits: number; inventoryValue: number; lowStockProducts: number; activeWarehouses: number
}

export type StockFilters = { page?: number; limit?: number; search?: string; warehouseId?: string }

function query(filters: StockFilters) {
  return new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== undefined && value !== "").map(([key, value]) => [key, String(value)]))
}

export function getInventoryStock(filters: StockFilters, signal?: AbortSignal) {
  return apiRequest<StockRow[]>(`/api/inventory/stock?${query(filters)}`, { signal })
}

export function getInventorySummary(filters: Omit<StockFilters, "page" | "limit">, signal?: AbortSignal) {
  return apiRequest<StockSummary>(`/api/inventory/summary?${query(filters)}`, { signal })
}
