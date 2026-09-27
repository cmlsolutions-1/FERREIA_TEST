import { prisma } from "@/server/database/prisma"
export const promotionRepository = {
  list() { return prisma.promotion.findMany({ include: { product: { include: { priceTiers: true } } }, orderBy: { updatedAt: "desc" } }) },
  product(sku: string) { return prisma.product.findUnique({ where: { sku }, include: { priceTiers: true } }) },
  save(productId: string, data: { kind: string; regularPrice: number; salePrice: number; basePrice: number; baseInnerPrice: number; baseMasterPrice: number; unitEnabled: boolean; unitDiscount: number; innerEnabled: boolean; innerDiscount: number; masterEnabled: boolean; masterDiscount: number; startsAt: Date | null; endsAt: Date | null; active: boolean }) { return prisma.promotion.upsert({ where: { productId }, create: { productId, ...data }, update: data, include: { product: { include: { priceTiers: true } } } }) },
  remove(productId: string) { return prisma.promotion.deleteMany({ where: { productId } }) },
}
