import type { Prisma } from "@prisma/client"
import { prisma } from "@/server/database/prisma"

export const orderInclude = { items: true, timeline: { orderBy: { occurredAt: "asc" } } } as const
export const orderRepository = {
  list(where: Prisma.OrderWhereInput, skip: number, take: number) { return prisma.order.findMany({ where, include: orderInclude, skip, take, orderBy: { createdAt: "desc" } }) },
  count(where: Prisma.OrderWhereInput) { return prisma.order.count({ where }) },
  find(id: string) { return prisma.order.findUnique({ where: { id }, include: orderInclude }) },
}
