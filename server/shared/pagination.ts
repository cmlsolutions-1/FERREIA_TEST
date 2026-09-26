import { z } from "zod"
import type { PaginationMeta } from "@/server/shared/api-response"

export const paginationSchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) })

export function paginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit)
  return { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 }
}
