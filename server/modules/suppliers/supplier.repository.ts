import type { Prisma } from "@prisma/client"
import { prisma } from "@/server/database/prisma"

const include = { _count: { select: { products: true, purchaseOrders: true } } } as const
export const supplierRepository = {
  list(where: Prisma.SupplierWhereInput, skip: number, take: number) {
    return prisma.supplier.findMany({ where, include, skip, take, orderBy: { name: "asc" } })
  },
  count(where: Prisma.SupplierWhereInput) { return prisma.supplier.count({ where }) },
  find(id: string) { return prisma.supplier.findUnique({ where: { id }, include }) },
  create(data: Prisma.SupplierUncheckedCreateInput) { return prisma.supplier.create({ data, include }) },
  update(id: string, data: Prisma.SupplierUncheckedUpdateInput) { return prisma.supplier.update({ where: { id }, data, include }) },
  async summary() {
    const [activeSuppliers, references, balance, purchaseOrders] = await Promise.all([
      prisma.supplier.count({ where: { active: true } }),
      prisma.productSupplier.count({ where: { supplier: { active: true } } }),
      prisma.supplier.aggregate({ where: { active: true }, _sum: { balance: true } }),
      prisma.purchaseOrder.count(),
    ])
    return { activeSuppliers, references, balance: balance._sum.balance?.toNumber() ?? 0, purchaseOrders }
  },
}
