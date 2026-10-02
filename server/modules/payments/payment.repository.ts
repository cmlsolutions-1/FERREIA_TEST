import type { Prisma } from "@prisma/client"
import { prisma } from "@/server/database/prisma"
export const paymentRepository = {
  list(where: Prisma.PaymentWhereInput, skip: number, take: number) { return prisma.payment.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }) },
  count(where: Prisma.PaymentWhereInput) { return prisma.payment.count({ where }) },
  find(id: string) { return prisma.payment.findUnique({ where: { id } }) },
  findByOrder(orderId: string) { return prisma.payment.findMany({ where: { orderId }, select: { status: true } }) },
  upsert(id: string, create: Prisma.PaymentUncheckedCreateInput, update: Prisma.PaymentUncheckedUpdateInput) {
    return prisma.payment.upsert({ where: { id }, create, update })
  },
}
