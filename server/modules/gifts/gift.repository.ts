import { prisma } from "@/server/database/prisma"

export const giftInclude = { product: { include: { images: { orderBy: { position: "asc" } }, category: true } } } as const

export const giftRepository = {
  list() { return prisma.giftTier.findMany({ include: giftInclude, orderBy: { minSubtotal: "asc" } }) },
  find(id: string) { return prisma.giftTier.findUnique({ where: { id }, include: giftInclude }) },
  product(id: string) { return prisma.product.findUnique({ where: { id }, include: { category: true } }) },
  create(data: { minSubtotal: number; maxSubtotal: number | null; stepAmount: number; productId: string; active: boolean }) {
    return prisma.giftTier.create({ data, include: giftInclude })
  },
  update(id: string, data: { minSubtotal: number; maxSubtotal: number | null; stepAmount: number; productId: string; active: boolean }) {
    return prisma.giftTier.update({ where: { id }, data, include: giftInclude })
  },
  remove(id: string) { return prisma.giftTier.delete({ where: { id } }) },
}
