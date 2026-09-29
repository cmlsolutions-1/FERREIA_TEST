import { aiAgent } from "@/server/modules/ai/ai.agent"
import { advisorRequestSchema } from "@/server/modules/ai/ai.schema"
import { handleApi, success } from "@/server/shared/api-response"
import { parseBody } from "@/server/shared/validation"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  return handleApi(async () => {
    const input = await parseBody(request, advisorRequestSchema)
    const response = await aiAgent.advise(input)
    return success("Solicitud analizada correctamente", response)
  })
}
