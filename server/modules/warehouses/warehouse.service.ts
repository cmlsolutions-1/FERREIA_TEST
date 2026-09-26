import type { Prisma } from "@prisma/client"
import type { z } from "zod"
import { warehouseRepository } from "@/server/modules/warehouses/warehouse.repository"
import { createWarehouseSchema, updateWarehouseSchema, warehouseFiltersSchema } from "@/server/modules/warehouses/warehouse.schema"
import { ApiError } from "@/server/shared/api-error"
import { paginationMeta } from "@/server/shared/pagination"

type Filters = z.infer<typeof warehouseFiltersSchema>
type Create = z.infer<typeof createWarehouseSchema>
type Update = z.infer<typeof updateWarehouseSchema>

export const warehouseService = {
  async list(filters: Filters) {
    const where: Prisma.WarehouseWhereInput = {
      ...(filters.active ? { active: filters.active === "true" } : {}),
      ...(filters.search ? { OR: [
        { code: { contains: filters.search, mode: "insensitive" } },
        { name: { contains: filters.search, mode: "insensitive" } },
      ] } : {}),
    }
    const [data, total] = await Promise.all([
      warehouseRepository.list(where, (filters.page - 1) * filters.limit, filters.limit),
      warehouseRepository.count(where),
    ])
    return { data, meta: paginationMeta(filters.page, filters.limit, total) }
  },
  async get(id: string) {
    const warehouse = await warehouseRepository.find(id)
    if (!warehouse) throw new ApiError(404, "WAREHOUSE_NOT_FOUND", "No fue posible encontrar la bodega")
    return warehouse
  },
  create(input: Create) { return warehouseRepository.create({ id: `WH-${crypto.randomUUID()}`, ...input }) },
  async update(id: string, input: Update) {
    await this.get(id)
    return warehouseRepository.update(id, input)
  },
  async remove(id: string) {
    await this.get(id)
    await warehouseRepository.update(id, { active: false })
  },
}
