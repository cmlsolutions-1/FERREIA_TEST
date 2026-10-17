import { z } from "zod"
import { ApiError } from "@/server/shared/api-error"
import { assertContentLength, assertTrustedOrigin } from "@/server/shared/request-security"

export const idSchema = z.object({ id: z.string().trim().min(1).max(128) })

export async function parseBody<T extends z.ZodTypeAny>(request: Request, schema: T, maxBytes = 1_048_576): Promise<z.infer<T>> {
  assertTrustedOrigin(request)
  assertContentLength(request, maxBytes)
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "El contenido debe enviarse como JSON")
  }
  let body: unknown
  try {
    if (!request.body) throw new Error("Missing body")
    const reader = request.body.getReader()
    const chunks: Uint8Array[] = []
    let size = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) {
        await reader.cancel()
        throw new ApiError(413, "PAYLOAD_TOO_LARGE", "La solicitud supera el tamaño permitido")
      }
      chunks.push(value)
    }
    const bytes = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
    body = JSON.parse(new TextDecoder().decode(bytes))
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError(400, "INVALID_REQUEST", "El cuerpo debe ser JSON válido")
  }
  return schema.parse(body)
}

export function parseSearch<T extends z.ZodTypeAny>(request: Request, schema: T): z.infer<T> {
  return schema.parse(Object.fromEntries(new URL(request.url).searchParams))
}
