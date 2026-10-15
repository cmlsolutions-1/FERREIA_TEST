import { z } from "zod"

const amount = z.number().finite().nonnegative().max(1_000_000_000)

export const giftTierSchema = z.object({
  minSubtotal: amount,
  maxSubtotal: amount.nullable(),
  stepAmount: amount.positive(),
  productId: z.string().trim().min(1),
  active: z.boolean(),
}).strict().refine((value) => value.maxSubtotal === null || value.maxSubtotal > value.minSubtotal + value.stepAmount, {
  message: "El límite superior debe superar el monto necesario para obtener el obsequio",
  path: ["maxSubtotal"],
})

export const giftQuoteSchema = z.object({ subtotal: z.coerce.number().finite().nonnegative().max(1_000_000_000) })
