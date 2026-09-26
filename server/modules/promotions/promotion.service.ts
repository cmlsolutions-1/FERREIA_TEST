import type { z } from "zod"
import { promotionRepository } from "@/server/modules/promotions/promotion.repository"
import { promotionSchema } from "@/server/modules/promotions/promotion.schema"
import { ApiError } from "@/server/shared/api-error"

type Record = Awaited<ReturnType<typeof promotionRepository.list>>[number]
const number = (value: { toNumber(): number }) => value.toNumber()
function dto(item: Record) { return { sku: item.product.sku, kind: item.kind, regularPrice: number(item.regularPrice), salePrice: number(item.salePrice), basePrice: number(item.basePrice), startsAt: item.startsAt?.toISOString().slice(0, 10) ?? "", endsAt: item.endsAt?.toISOString().slice(0, 10) ?? "", active: item.active, updatedAt: item.updatedAt.toISOString() } }
export const promotionService = {
  async list() { return (await promotionRepository.list()).map(dto) },
  async save(input: z.infer<typeof promotionSchema>) { const product = await promotionRepository.product(input.sku); if (!product || !product.active) throw new ApiError(404, "PRODUCT_NOT_FOUND", "El producto no está disponible"); return dto(await promotionRepository.save(product.id, { kind: input.kind, regularPrice: input.regularPrice, salePrice: input.salePrice, basePrice: product.price.toNumber(), startsAt: input.startsAt ? new Date(input.startsAt) : null, endsAt: input.endsAt ? new Date(input.endsAt) : null, active: input.active })) },
  async remove(sku: string) { const product = await promotionRepository.product(sku); if (!product) throw new ApiError(404, "PRODUCT_NOT_FOUND", "No fue posible encontrar el producto"); const result = await promotionRepository.remove(product.id); if (!result.count) throw new ApiError(404, "PROMOTION_NOT_FOUND", "No fue posible encontrar la promoción") },
}
