import type { Prisma } from "@prisma/client"
import type { z } from "zod"
import { stockRepository } from "@/server/modules/inventory/stock.repository"
import { stockFiltersSchema, stockSummaryFiltersSchema } from "@/server/modules/inventory/stock.schema"
import { paginationMeta } from "@/server/shared/pagination"

type Filters = z.infer<typeof stockFiltersSchema>
type SummaryFilters = z.infer<typeof stockSummaryFiltersSchema>

function buildWhere(filters: SummaryFilters): Prisma.ProductWhereInput {
  return {
    ...(filters.warehouseId ? { warehouseId: filters.warehouseId } : {}),
    ...(filters.search ? { OR: [
      { reference: { contains: filters.search, mode: "insensitive" } },
      { sku: { contains: filters.search, mode: "insensitive" } },
      { name: { contains: filters.search, mode: "insensitive" } },
      { brand: { name: { contains: filters.search, mode: "insensitive" } } },
    ] } : {}),
  }
}

export const stockService = {
  async list(filters: Filters) {
    const where = buildWhere(filters)
    const [rows, total] = await Promise.all([
      stockRepository.list(where, (filters.page - 1) * filters.limit, filters.limit),
      stockRepository.count(where),
    ])
    const data = rows.map((row) => ({
      id: row.id, reference: row.reference, sku: row.sku, name: row.name,
      brand: row.brand.name, warehouseId: row.warehouse?.id ?? null,
      warehouse: row.warehouse?.name ?? "", stock: row.stock, stockMin: row.stockMin,
      stockMax: row.stockMax, cost: row.cost.toNumber(), active: row.active,
    }))
    return { data, meta: paginationMeta(filters.page, filters.limit, total) }
  },
  async summary(filters: SummaryFilters) {
    const where = buildWhere(filters)
    const [rows, activeWarehouses] = await Promise.all([
      stockRepository.summaryRows(where), stockRepository.activeWarehouseCount(),
    ])
    return {
      availableUnits: rows.reduce((total, row) => total + row.stock, 0),
      inventoryValue: rows.reduce((total, row) => total + row.stock * row.cost.toNumber(), 0),
      lowStockProducts: rows.filter((row) => row.stock <= row.stockMin).length,
      activeWarehouses,
    }
  },
}
