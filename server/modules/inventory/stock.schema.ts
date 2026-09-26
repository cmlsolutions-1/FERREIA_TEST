import { z } from "zod"
import { paginationSchema } from "@/server/shared/pagination"

export const stockFiltersSchema = paginationSchema.extend({
  search: z.string().trim().max(120).optional(),
  warehouseId: z.string().trim().max(100).optional(),
})

export const stockSummaryFiltersSchema = stockFiltersSchema.omit({ page: true, limit: true })
