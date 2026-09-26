import { z } from "zod"
import { paginationSchema } from "@/server/shared/pagination"

export const warehouseFiltersSchema = paginationSchema.extend({
  search: z.string().trim().max(100).optional(),
  active: z.enum(["true", "false"]).optional(),
})

export const createWarehouseSchema = z.object({
  code: z.string().trim().min(1).max(40),
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().max(200).default(""),
  manager: z.string().trim().max(120).default(""),
  type: z.enum(["Principal", "Auxiliar", "Punto de venta"]),
  active: z.boolean().default(true),
}).strict()

export const updateWarehouseSchema = createWarehouseSchema.partial().refine((value) => Object.keys(value).length > 0, "Envía al menos un campo")
export const warehouseIdSchema = z.object({ id: z.string().trim().min(1).max(100) })
