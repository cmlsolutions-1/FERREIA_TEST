import { z } from "zod"
const tierDiscountSchema = z.object({ enabled: z.boolean(), percent: z.number().finite().min(0).max(99) }).strict().refine((tier) => !tier.enabled || tier.percent > 0, "El porcentaje debe ser mayor que cero para una presentación activa")
export const promotionSchema = z.object({
  sku: z.string().trim().min(1), kind: z.enum(["promocion", "outlet"]),
  tiers: z.object({ unit: tierDiscountSchema, inner: tierDiscountSchema, master: tierDiscountSchema }).strict(),
  startsAt: z.iso.date().or(z.literal("")), endsAt: z.iso.date().or(z.literal("")), active: z.boolean(),
}).strict().refine((value) => Object.values(value.tiers).some((tier) => tier.enabled), "Selecciona al menos una presentación").refine((value) => !value.startsAt || !value.endsAt || value.startsAt <= value.endsAt, "La fecha final debe ser posterior a la inicial")
