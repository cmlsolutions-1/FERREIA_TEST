import type { Prisma } from "@prisma/client"
import { prisma } from "@/server/database/prisma"

export const classificationRepository = {
  list(where: Prisma.ProductClassificationWhereInput, skip: number, take: number) {
    return prisma.productClassification.findMany({ where, skip, take, orderBy: [{ kind: "asc" }, { name: "asc" }] })
  },
  count(where: Prisma.ProductClassificationWhereInput) { return prisma.productClassification.count({ where }) },
  find(id: string) { return prisma.productClassification.findUnique({ where: { id } }) },
  findSibling(kind: "LINE" | "GROUP" | "SUBGROUP", parentId: string | null, name: string) {
    return prisma.productClassification.findFirst({ where: { kind, parentId, name: { equals: name, mode: "insensitive" } } })
  },
  create(data: Prisma.ProductClassificationUncheckedCreateInput) { return prisma.productClassification.create({ data }) },
  update(id: string, data: Prisma.ProductClassificationUncheckedUpdateInput) { return prisma.productClassification.update({ where: { id }, data }) },
}
