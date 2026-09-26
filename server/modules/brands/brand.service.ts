import type { Prisma } from "@prisma/client"
import type { z } from "zod"
import { brandRepository } from "@/server/modules/brands/brand.repository"
import { brandFiltersSchema, createBrandSchema, updateBrandSchema } from "@/server/modules/brands/brand.schema"
import { ApiError } from "@/server/shared/api-error"
import { paginationMeta } from "@/server/shared/pagination"

type Filters = z.infer<typeof brandFiltersSchema>
export const brandService = {
  async list(filters: Filters) {
    const where: Prisma.BrandWhereInput = { ...(filters.active ? { active: filters.active === "true" } : {}), ...(filters.search ? { name: { contains: filters.search, mode: "insensitive" } } : {}) }
    const [data, total] = await Promise.all([brandRepository.list(where, (filters.page - 1) * filters.limit, filters.limit), brandRepository.count(where)])
    return { data: data.map((item) => ({ ...item, productCount: item._count.products })), meta: paginationMeta(filters.page, filters.limit, total) }
  },
  async get(id: string) { const brand = await brandRepository.find(id); if (!brand) throw new ApiError(404, "BRAND_NOT_FOUND", "No fue posible encontrar la marca"); return { ...brand, productCount: brand._count.products } },
  create(input: z.infer<typeof createBrandSchema>) { return brandRepository.create({ id: `BR-${crypto.randomUUID()}`, ...input }) },
  async update(id: string, input: z.infer<typeof updateBrandSchema>) { const brand = await this.get(id); return brandRepository.update(brand.id, input) },
  async remove(id: string) { const brand = await this.get(id); if (brand._count.products) throw new ApiError(409, "RECORD_IN_USE", "La marca tiene productos asociados"); await brandRepository.delete(brand.id) },
}
