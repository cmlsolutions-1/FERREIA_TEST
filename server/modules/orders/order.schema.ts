import { z } from "zod"
import { paginationSchema } from "@/server/shared/pagination"
import { ORDER_STATUSES } from "@/lib/orders"

export const orderFiltersSchema = paginationSchema.extend({ status: z.enum(ORDER_STATUSES).optional(), search: z.string().max(120).optional() })
export const createOrderSchema = z.object({
  customerId: z.string().max(128).nullable().optional(), guest: z.boolean(), customerName: z.string().trim().min(2).max(120),
  document: z.string().trim().min(3).max(40), email: z.email().max(254), phone: z.string().trim().min(5).max(30),
  items: z.array(z.object({ productId: z.string().min(1).max(128), quantity: z.number().int().min(1).max(1_000) })).min(1).max(100),
  paymentMethod: z.enum(["Mercado Pago", "Contra entrega"]), paymentStatus: z.enum(["Pendiente", "Pagado", "Contra entrega"]),
  shippingMethod: z.enum(["Estándar", "Express"]), address: z.string().trim().min(5).max(250),
  city: z.string().trim().min(2).max(100), department: z.string().trim().min(2).max(100),
}).strict()
export const updateOrderSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(), paymentStatus: z.enum(["Pendiente", "Pagado", "Contra entrega", "Reembolsado", "Rechazado"]).optional(),
  carrier: z.string().max(100).optional(), trackingNumber: z.string().max(100).optional(),
  currentLocation: z.string().max(200).optional(), detail: z.string().max(500).optional(),
  estimatedFrom: z.iso.date().optional(), estimatedTo: z.iso.date().optional(),
  notifyCustomer: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "Envía al menos un campo")
