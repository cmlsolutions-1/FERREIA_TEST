import { aiAgent } from "@/server/modules/ai/ai.agent"
import { advisorRequestSchema } from "@/server/modules/ai/ai.schema"
import { handleApi, success } from "@/server/shared/api-response"
import { parseBody } from "@/server/shared/validation"
import { assertRateLimit } from "@/server/shared/request-security"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  return handleApi(async () => {
    assertRateLimit(request, "ai-advisor", { limit: 6, windowMs: 10 * 60_000 })
    const input = await parseBody(request, advisorRequestSchema, 8_500_000)
    const response = await aiAgent.advise(input)
    return success("Solicitud analizada correctamente", response)
  })
}
