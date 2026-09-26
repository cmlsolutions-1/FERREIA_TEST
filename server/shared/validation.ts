import { z } from "zod"
import { ApiError } from "@/server/shared/api-error"

export const idSchema = z.object({ id: z.string().trim().min(1).max(128) })

export async function parseBody<T extends z.ZodTypeAny>(request: Request, schema: T): Promise<z.infer<T>> {
  let body: unknown
  try { body = await request.json() } catch { throw new ApiError(400, "INVALID_REQUEST", "El cuerpo debe ser JSON válido") }
  return schema.parse(body)
}

export function parseSearch<T extends z.ZodTypeAny>(request: Request, schema: T): z.infer<T> {
  return schema.parse(Object.fromEntries(new URL(request.url).searchParams))
}
