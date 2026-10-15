import type { z } from "zod"
import { giftRepository } from "@/server/modules/gifts/gift.repository"
import { giftTierSchema } from "@/server/modules/gifts/gift.schema"
import { ApiError } from "@/server/shared/api-error"

type GiftRecord = Awaited<ReturnType<typeof giftRepository.list>>[number]
const num = (value: { toNumber(): number }) => value.toNumber()

function dto(record: GiftRecord) {
  return {
    id: record.id,
    minSubtotal: num(record.minSubtotal),
    maxSubtotal: record.maxSubtotal === null ? null : num(record.maxSubtotal),
    stepAmount: num(record.stepAmount),
    productId: record.productId,
    product: {
      id: record.product.id, sku: record.product.sku, reference: record.product.reference,
      name: record.product.name, image: record.product.images[0]?.url ?? "/placeholder.svg",
      stock: record.product.stock, active: record.product.active,
    },
    active: record.active,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

function inRange(subtotal: number, record: GiftRecord) {
  return subtotal >= num(record.minSubtotal) && (record.maxSubtotal === null || subtotal < num(record.maxSubtotal))
}

export function giftForSubtotal(records: GiftRecord[], subtotal: number) {
  return records.find((record) => record.active && record.product.category.slug === "gp" && record.product.active && record.product.stock > 0 && inRange(subtotal, record)) ?? null
}

export const giftService = {
  async list(admin = false) {
    const records = await giftRepository.list()
    return records.filter((record) => admin || (record.active && record.product.category.slug === "gp" && record.product.active && record.product.stock > 0)).map(dto)
  },
  async quote(subtotal: number) {
    const records = (await giftRepository.list()).filter((record) => record.active)
    const matching = records.find((record) => inRange(subtotal, record))
    if (matching && (matching.product.category.slug !== "gp" || !matching.product.active || matching.product.stock <= 0)) {
      return { status: "none" as const, tier: null, target: null, remaining: null }
    }
    const current = giftForSubtotal(records, subtotal)
    const tier = current ?? records.find((record) => record.product.category.slug === "gp" && record.product.active && record.product.stock > 0 && num(record.minSubtotal) > subtotal) ?? null
    if (!tier) return { status: "none" as const, tier: null, target: null, remaining: null }
    const target = num(tier.minSubtotal) + num(tier.stepAmount)
    return { status: current && subtotal >= target ? "earned" as const : "progress" as const, tier: dto(tier), target, remaining: Math.max(0, target - subtotal) }
  },
  async save(input: z.infer<typeof giftTierSchema>, id?: string) {
    const product = await giftRepository.product(input.productId)
    if (!product || product.category.slug !== "gp") throw new ApiError(422, "GIFT_PRODUCT_REQUIRED", "Selecciona un artículo de la categoría GP")
    const existing = await giftRepository.list()
    if (id && !existing.some((item) => item.id === id)) throw new ApiError(404, "GIFT_TIER_NOT_FOUND", "No se encontró la regla de obsequio")
    if (input.active && existing.some((item) => item.active && item.id !== id &&
      (input.maxSubtotal === null || num(item.minSubtotal) < input.maxSubtotal) &&
      (item.maxSubtotal === null || input.minSubtotal < num(item.maxSubtotal)))) {
      throw new ApiError(409, "GIFT_TIER_OVERLAP", "Hay otra regla activa que cubre parte de este rango")
    }
    return dto(id ? await giftRepository.update(id, input) : await giftRepository.create(input))
  },
  async remove(id: string) {
    const existing = await giftRepository.find(id)
    if (!existing) throw new ApiError(404, "GIFT_TIER_NOT_FOUND", "No se encontró la regla de obsequio")
    await giftRepository.remove(id)
  },
}
