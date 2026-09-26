import type { Prisma } from "@prisma/client"
import { prisma } from "@/server/database/prisma"

const include = { _count: { select: { products: true, children: true } } } as const
export const categoryRepository = {
  list(where: Prisma.CategoryWhereInput, skip: number, take: number) { return prisma.category.findMany({ where, include, skip, take, orderBy: { name: "asc" } }) },
  count(where: Prisma.CategoryWhereInput) { return prisma.category.count({ where }) },
  find(id: string) { return prisma.category.findFirst({ where: { OR: [{ id }, { slug: id }] }, include }) },
  create(data: Prisma.CategoryUncheckedCreateInput) { return prisma.category.create({ data, include }) },
  update(id: string, data: Prisma.CategoryUncheckedUpdateInput) { return prisma.category.update({ where: { id }, data, include }) },
  delete(id: string) { return prisma.category.delete({ where: { id } }) },
}
