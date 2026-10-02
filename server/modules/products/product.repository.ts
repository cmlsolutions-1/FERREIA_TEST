import type { Prisma } from "@prisma/client"
import { prisma } from "@/server/database/prisma"

export const productInclude = { category: true, brand: true, warehouse: true, images: { orderBy: { position: "asc" } }, barcodes: true, priceTiers: true, specs: { orderBy: { position: "asc" } }, compatibilities: true, suppliers: { include: { supplier: true } }, promotion: true, costReview: true } as const

export const productRepository = {
  list(where: Prisma.ProductWhereInput, skip: number, take: number, orderBy: Prisma.ProductOrderByWithRelationInput) { return prisma.product.findMany({ where, include: productInclude, skip, take, orderBy }) },
  count(where: Prisma.ProductWhereInput) { return prisma.product.count({ where }) },
  find(id: string) { return prisma.product.findFirst({ where: { OR: [{ id }, { sku: id }, { reference: id }] }, include: productInclude }) },
  spellingTerms() {
    return prisma.product.findMany({
      where: { active: true },
      select: {
        name: true,
        subcategory: true,
        line: true,
        group: true,
        subgroup: true,
        material: true,
        category: { select: { name: true } },
        brand: { select: { name: true } },
      },
    })
  },
  create(data: Prisma.ProductUncheckedCreateInput) { return prisma.product.create({ data, include: productInclude }) },
  update(id: string, data: Prisma.ProductUncheckedUpdateInput) { return prisma.product.update({ where: { id }, data, include: productInclude }) },
}
