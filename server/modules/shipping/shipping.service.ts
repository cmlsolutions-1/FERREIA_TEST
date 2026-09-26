import type { z } from "zod"
import { shippingRepository } from "@/server/modules/shipping/shipping.repository"
import { shippingSchema } from "@/server/modules/shipping/shipping.schema"
import { ApiError } from "@/server/shared/api-error"
type Record = NonNullable<Awaited<ReturnType<typeof shippingRepository.get>>>
function dto(item: Record) { const method = (id: string) => { const found = item.methods.find((entry) => entry.id === id); if (!found) throw new ApiError(500, "SHIPPING_CONFIGURATION_ERROR", "La configuración de envíos está incompleta"); return { active: found.active, baseCost: found.baseCost.toNumber(), minDays: found.minDays, maxDays: found.maxDays, freeShippingEligible: found.freeEligible } }; return { enabled: item.enabled, freeShipping: { enabled: item.freeEnabled, byAmount: item.freeByAmount, minimumAmount: item.minimumAmount.toNumber(), byQuantity: item.freeByQuantity, minimumQuantity: item.minimumQuantity, mode: item.freeMode }, standard: method("standard"), express: method("express"), zones: item.zones.map((zone) => ({ id: zone.id, name: zone.name, departments: zone.departments, surcharge: zone.surcharge.toNumber(), active: zone.active })) } }
export const shippingService = {
  async get() { const result = await shippingRepository.get(); if (!result) throw new ApiError(404, "SHIPPING_NOT_FOUND", "No se encontró la configuración de envíos"); return dto(result) },
  async save(input: z.infer<typeof shippingSchema>) { const result = await shippingRepository.save(input); if (!result) throw new ApiError(500, "SHIPPING_CONFIGURATION_ERROR", "No fue posible guardar los envíos"); return dto(result) },
}
