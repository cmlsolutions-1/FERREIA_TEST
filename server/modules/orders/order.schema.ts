import { z } from "zod"
import { paginationSchema } from "@/server/shared/pagination"
import { ORDER_STATUSES } from "@/lib/orders"

export const orderFiltersSchema = paginationSchema.extend({ status: z.string().optional(), search: z.string().max(120).optional() })
export const createOrderSchema = z.object({
  customerId: z.string().nullable().optional(), guest: z.boolean(), customerName: z.string().trim().min(2),
  document: z.string().trim().min(3), email: z.email(), phone: z.string().trim().min(5),
  items: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().positive() })).min(1),
  paymentMethod: z.string().trim().min(1), paymentStatus: z.enum(["Pendiente", "Pagado", "Contra entrega"]),
  shippingMethod: z.enum(["Estándar", "Express"]), address: z.string().trim().min(5),
  city: z.string().trim().min(2), department: z.string().trim().min(2),
}).strict()
export const updateOrderSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(), paymentStatus: z.enum(["Pendiente", "Pagado", "Contra entrega", "Reembolsado"]).optional(),
  carrier: z.string().max(100).optional(), trackingNumber: z.string().max(100).optional(),
  currentLocation: z.string().max(200).optional(), detail: z.string().max(500).optional(),
  estimatedFrom: z.iso.date().optional(), estimatedTo: z.iso.date().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "Envía al menos un campo")
