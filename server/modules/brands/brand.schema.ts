import { z } from "zod"
import { paginationSchema } from "@/server/shared/pagination"

export const brandFiltersSchema = paginationSchema.extend({ search: z.string().trim().max(100).optional(), active: z.enum(["true", "false"]).optional() })
export const createBrandSchema = z.object({ name: z.string().trim().min(2).max(120), country: z.string().trim().max(100).default(""), active: z.boolean().default(true) }).strict()
export const updateBrandSchema = createBrandSchema.partial().refine((value) => Object.keys(value).length > 0, "Envía al menos un campo")
