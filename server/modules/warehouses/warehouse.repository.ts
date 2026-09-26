import type { Prisma } from "@prisma/client"
import { prisma } from "@/server/database/prisma"

export const warehouseRepository = {
  list(where: Prisma.WarehouseWhereInput, skip: number, take: number) {
    return prisma.warehouse.findMany({ where, skip, take, orderBy: { name: "asc" } })
  },
  count(where: Prisma.WarehouseWhereInput) { return prisma.warehouse.count({ where }) },
  find(id: string) { return prisma.warehouse.findUnique({ where: { id } }) },
  create(data: Prisma.WarehouseCreateInput) { return prisma.warehouse.create({ data }) },
  update(id: string, data: Prisma.WarehouseUpdateInput) { return prisma.warehouse.update({ where: { id }, data }) },
}
