import { prisma } from "@/server/database/prisma"
export const promotionRepository = {
  list() { return prisma.promotion.findMany({ include: { product: true }, orderBy: { updatedAt: "desc" } }) },
  product(sku: string) { return prisma.product.findUnique({ where: { sku } }) },
  save(productId: string, data: { kind: string; regularPrice: number; salePrice: number; basePrice: number; startsAt: Date | null; endsAt: Date | null; active: boolean }) { return prisma.promotion.upsert({ where: { productId }, create: { productId, ...data }, update: data, include: { product: true } }) },
  remove(productId: string) { return prisma.promotion.deleteMany({ where: { productId } }) },
}
