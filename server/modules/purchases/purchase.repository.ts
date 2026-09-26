import type { Prisma } from "@prisma/client"
import { prisma } from "@/server/database/prisma"
export const purchaseInclude = { lines: true, invoice: { include: { lines: true } } } as const
export const purchaseRepository = {
  list(where: Prisma.PurchaseOrderWhereInput, skip: number, take: number) { return prisma.purchaseOrder.findMany({ where, skip, take, orderBy: { date: "desc" }, include: purchaseInclude }) },
  count(where: Prisma.PurchaseOrderWhereInput) { return prisma.purchaseOrder.count({ where }) },
  find(id: string) { return prisma.purchaseOrder.findUnique({ where: { id }, include: purchaseInclude }) },
}
