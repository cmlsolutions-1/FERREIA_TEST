import { z } from "zod"
import { aiConfig } from "@/server/modules/ai/ai.config"
import { ApiError } from "@/server/shared/api-error"

type OllamaMessage = {
  role: "system" | "user" | "assistant"
  content: string
  images?: string[]
}

const ollamaResponseSchema = z.object({
  model: z.string(),
  message: z.object({ content: z.string() }),
})

let requestInProgress = false

async function structuredChat<T>(messages: OllamaMessage[], schema: z.ZodType<T>): Promise<{ data: T; model: string }> {
  if (requestInProgress) {
    throw new ApiError(429, "AI_BUSY", "FerreBot está procesando otra consulta. Intenta nuevamente en unos segundos")
  }

  requestInProgress = true
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), aiConfig.timeoutMs)

  try {
    const jsonSchema = z.toJSONSchema(schema)
    const response = await fetch(`${aiConfig.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      signal: controller.signal,
      body: JSON.stringify({
        model: aiConfig.model,
        stream: false,
        format: jsonSchema,
        messages,
        options: {
          temperature: 0,
          num_ctx: aiConfig.contextLength,
          num_predict: aiConfig.maxOutputTokens,
        },
      }),
    })

    if (!response.ok) {
      throw new ApiError(503, "AI_PROVIDER_ERROR", "Ollama no pudo procesar la consulta")
    }

    const payload = ollamaResponseSchema.parse(await response.json())
    let decoded: unknown
    try {
      decoded = JSON.parse(payload.message.content)
    } catch {
      throw new ApiError(502, "AI_INVALID_RESPONSE", "La IA devolvió una respuesta que no se pudo validar")
    }

    return { data: schema.parse(decoded), model: payload.model }
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(504, "AI_TIMEOUT", "La IA tardó demasiado en responder")
    }
    if (error instanceof z.ZodError) {
      throw new ApiError(502, "AI_INVALID_RESPONSE", "La IA devolvió datos incompletos o inválidos")
    }
    throw new ApiError(503, "AI_UNAVAILABLE", "Ollama no está disponible en este momento")
  } finally {
    clearTimeout(timeout)
    requestInProgress = false
  }
}

export const aiProvider = { structuredChat }
