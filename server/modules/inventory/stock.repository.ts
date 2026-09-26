import type { Prisma } from "@prisma/client"
import { prisma } from "@/server/database/prisma"

export const stockRepository = {
  list(where: Prisma.ProductWhereInput, skip: number, take: number) {
    return prisma.product.findMany({
      where, skip, take, orderBy: { name: "asc" },
      select: { id: true, reference: true, sku: true, name: true, stock: true, stockMin: true, stockMax: true, cost: true, active: true, brand: { select: { name: true } }, warehouse: { select: { id: true, name: true } } },
    })
  },
  count(where: Prisma.ProductWhereInput) { return prisma.product.count({ where }) },
  summaryRows(where: Prisma.ProductWhereInput) {
    return prisma.product.findMany({ where, select: { stock: true, stockMin: true, cost: true } })
  },
  activeWarehouseCount() { return prisma.warehouse.count({ where: { active: true } }) },
}
