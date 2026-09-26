import { z } from "zod"
import { paginationSchema } from "@/server/shared/pagination"

export const supplierFiltersSchema = paginationSchema.extend({
  search: z.string().trim().max(120).optional(),
  active: z.enum(["true", "false"]).optional(),
})
export const createSupplierSchema = z.object({
  name: z.string().trim().min(2).max(160),
  nit: z.string().trim().min(4).max(40),
  contact: z.string().trim().max(160).default(""),
  city: z.string().trim().max(100).default(""),
  category: z.string().trim().max(100).default(""),
  commercialTerms: z.string().trim().max(2000).default(""),
}).strict()
export const updateSupplierSchema = createSupplierSchema.partial().extend({ active: z.boolean().optional() }).refine((value) => Object.keys(value).length > 0, "Envía al menos un campo")
