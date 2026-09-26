import { z } from "zod"
import { paginationSchema } from "@/server/shared/pagination"

export const classificationKindSchema = z.enum(["LINE", "GROUP", "SUBGROUP"])
export const classificationFiltersSchema = paginationSchema.extend({
  kind: classificationKindSchema.optional(),
  active: z.enum(["true", "false"]).optional(),
  search: z.string().trim().max(100).optional(),
})
export const createClassificationSchema = z.object({
  kind: classificationKindSchema,
  name: z.string().trim().min(2).max(120),
  parentId: z.string().trim().min(1).max(128).nullable(),
  active: z.boolean().default(true),
}).strict()
export const updateClassificationSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  active: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, "Envía al menos un campo")
