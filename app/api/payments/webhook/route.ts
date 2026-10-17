import { z } from "zod"
import { mercadoPagoService } from "@/server/modules/payments/mercado-pago.service"
import { handleApi, success } from "@/server/shared/api-response"
import { assertContentLength, assertRateLimit } from "@/server/shared/request-security"

export const runtime = "nodejs"

const webhookSchema = z.object({
  action: z.string().optional(),
  type: z.string().optional(),
  topic: z.string().optional(),
  data: z.object({ id: z.union([z.string(), z.number()]).optional() }).optional(),
}).passthrough()

export async function POST(request: Request) {
  return handleApi(async () => {
    assertRateLimit(request, "payment-webhook", { limit: 120, windowMs: 60_000 })
    assertContentLength(request, 64 * 1024)
    const url = new URL(request.url)
    const body = webhookSchema.parse(await request.json().catch(() => ({})))
    const dataId = url.searchParams.get("data.id") ?? (body.data?.id === undefined ? "" : String(body.data.id))
    const topic = body.type ?? body.topic ?? url.searchParams.get("type") ?? url.searchParams.get("topic")
    if (!dataId || (topic && topic !== "payment")) return success("Notificación ignorada", { processed: false })
    mercadoPagoService.validateWebhook(request, dataId)
    await mercadoPagoService.synchronize(dataId, body.action ?? "payment.updated", true)
    return success("Notificación procesada correctamente", { processed: true })
  })
}
