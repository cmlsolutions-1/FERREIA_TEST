import { z } from "zod"
const method = z.object({ active: z.boolean(), baseCost: z.number().nonnegative(), minDays: z.number().int().nonnegative(), maxDays: z.number().int().nonnegative(), freeShippingEligible: z.boolean() }).refine((value) => value.maxDays >= value.minDays, "El máximo de días debe ser mayor al mínimo")
export const shippingSchema = z.object({
  enabled: z.boolean(),
  freeShipping: z.object({ enabled: z.boolean(), byAmount: z.boolean(), minimumAmount: z.number().nonnegative(), byQuantity: z.boolean(), minimumQuantity: z.number().int().positive(), mode: z.enum(["any", "all"]) }),
  standard: method, express: method,
  zones: z.array(z.object({ id: z.string().min(1), name: z.string().min(1), departments: z.array(z.string()), surcharge: z.number().nonnegative(), active: z.boolean() })).max(100),
}).strict()
