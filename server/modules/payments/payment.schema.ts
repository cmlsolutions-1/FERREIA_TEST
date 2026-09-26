import { z } from "zod"
import { paginationSchema } from "@/server/shared/pagination"
export const paymentFiltersSchema = paginationSchema.extend({ status: z.string().max(40).optional(), search: z.string().max(120).optional() })
