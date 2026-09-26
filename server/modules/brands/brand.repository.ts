import type { Prisma } from "@prisma/client"
import { prisma } from "@/server/database/prisma"

const include = { _count: { select: { products: true } } } as const
export const brandRepository = {
  list(where: Prisma.BrandWhereInput, skip: number, take: number) { return prisma.brand.findMany({ where, include, skip, take, orderBy: { name: "asc" } }) },
  count(where: Prisma.BrandWhereInput) { return prisma.brand.count({ where }) },
  find(id: string) { return prisma.brand.findFirst({ where: { OR: [{ id }, { name: id }] }, include }) },
  create(data: Prisma.BrandUncheckedCreateInput) { return prisma.brand.create({ data, include }) },
  update(id: string, data: Prisma.BrandUncheckedUpdateInput) { return prisma.brand.update({ where: { id }, data, include }) },
  delete(id: string) { return prisma.brand.delete({ where: { id } }) },
}
