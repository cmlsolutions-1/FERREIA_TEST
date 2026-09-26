import { z } from "zod"
import { paginationSchema } from "@/server/shared/pagination"

export const categoryFiltersSchema = paginationSchema.extend({ search: z.string().trim().max(100).optional(), parentId: z.string().max(128).optional(), active: z.enum(["true", "false"]).optional() })
export const createCategorySchema = z.object({ slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100), name: z.string().trim().min(2).max(120), icon: z.string().trim().max(80).optional(), parentId: z.string().trim().min(1).nullable().optional(), active: z.boolean().default(true) }).strict()
export const updateCategorySchema = createCategorySchema.partial().refine((value) => Object.keys(value).length > 0, "Envía al menos un campo")
