import type { Prisma } from "@prisma/client"
import type { z } from "zod"
import { categoryRepository } from "@/server/modules/categories/category.repository"
import { categoryFiltersSchema, createCategorySchema, updateCategorySchema } from "@/server/modules/categories/category.schema"
import { ApiError } from "@/server/shared/api-error"
import { paginationMeta } from "@/server/shared/pagination"

type Filters = z.infer<typeof categoryFiltersSchema>
export const categoryService = {
  async list(filters: Filters) {
    const where: Prisma.CategoryWhereInput = { ...(filters.active ? { active: filters.active === "true" } : {}), ...(filters.parentId ? { parentId: filters.parentId } : {}), ...(filters.search ? { OR: [{ name: { contains: filters.search, mode: "insensitive" } }, { slug: { contains: filters.search, mode: "insensitive" } }] } : {}) }
    const [data, total] = await Promise.all([categoryRepository.list(where, (filters.page - 1) * filters.limit, filters.limit), categoryRepository.count(where)])
    return { data: data.map((item) => ({ ...item, count: item._count.products })), meta: paginationMeta(filters.page, filters.limit, total) }
  },
  async get(id: string) { const category = await categoryRepository.find(id); if (!category) throw new ApiError(404, "CATEGORY_NOT_FOUND", "No fue posible encontrar la categoría"); return { ...category, count: category._count.products } },
  create(input: z.infer<typeof createCategorySchema>) { return categoryRepository.create({ ...input, id: crypto.randomUUID() }) },
  async update(id: string, input: z.infer<typeof updateCategorySchema>) { const category = await this.get(id); return categoryRepository.update(category.id, input) },
  async remove(id: string) { const category = await this.get(id); if (category._count.products || category._count.children) throw new ApiError(409, "RECORD_IN_USE", "La categoría tiene productos o subcategorías asociadas"); await categoryRepository.delete(category.id) },
}
