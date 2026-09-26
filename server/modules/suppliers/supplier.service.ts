import type { Prisma } from "@prisma/client"
import type { z } from "zod"
import { supplierRepository } from "@/server/modules/suppliers/supplier.repository"
import { createSupplierSchema, supplierFiltersSchema, updateSupplierSchema } from "@/server/modules/suppliers/supplier.schema"
import { ApiError } from "@/server/shared/api-error"
import { paginationMeta } from "@/server/shared/pagination"

type Supplier = NonNullable<Awaited<ReturnType<typeof supplierRepository.find>>>
function dto(supplier: Supplier) {
  return {
    id: supplier.id, name: supplier.name, nit: supplier.nit, contact: supplier.contact,
    city: supplier.city, category: supplier.category, commercialTerms: supplier.commercialTerms,
    active: supplier.active, balance: supplier.balance.toNumber(),
    productCount: supplier._count.products, purchaseOrderCount: supplier._count.purchaseOrders,
    createdAt: supplier.createdAt.toISOString(), updatedAt: supplier.updatedAt.toISOString(),
  }
}

export const supplierService = {
  async list(filters: z.infer<typeof supplierFiltersSchema>) {
    const where: Prisma.SupplierWhereInput = {
      ...(filters.active ? { active: filters.active === "true" } : {}),
      ...(filters.search ? { OR: [
        { name: { contains: filters.search, mode: "insensitive" } },
        { nit: { contains: filters.search, mode: "insensitive" } },
        { city: { contains: filters.search, mode: "insensitive" } },
        { contact: { contains: filters.search, mode: "insensitive" } },
      ] } : {}),
    }
    const [items, total] = await Promise.all([
      supplierRepository.list(where, (filters.page - 1) * filters.limit, filters.limit),
      supplierRepository.count(where),
    ])
    return { data: items.map(dto), meta: paginationMeta(filters.page, filters.limit, total) }
  },
  async get(id: string) {
    const supplier = await supplierRepository.find(id)
    if (!supplier) throw new ApiError(404, "SUPPLIER_NOT_FOUND", "No fue posible encontrar el proveedor")
    return dto(supplier)
  },
  async create(input: z.infer<typeof createSupplierSchema>) {
    return dto(await supplierRepository.create({ id: `PR-${crypto.randomUUID()}`, ...input }))
  },
  async update(id: string, input: z.infer<typeof updateSupplierSchema>) {
    await this.get(id)
    return dto(await supplierRepository.update(id, input))
  },
  async remove(id: string) {
    await this.get(id)
    return dto(await supplierRepository.update(id, { active: false }))
  },
  summary() { return supplierRepository.summary() },
}
