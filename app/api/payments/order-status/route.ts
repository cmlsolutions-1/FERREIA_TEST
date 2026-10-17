import { mercadoPagoService, orderPaymentStatusSchema } from "@/server/modules/payments/mercado-pago.service"
import { handleApi, success } from "@/server/shared/api-response"
import { parseBody } from "@/server/shared/validation"
import { assertRateLimit } from "@/server/shared/request-security"

export const runtime = "nodejs"

export async function POST(request: Request) {
  return handleApi(async () => {
    assertRateLimit(request, "payment-status", { limit: 30, windowMs: 10 * 60_000 })
    const { orderId, accessToken } = await parseBody(request, orderPaymentStatusSchema)
    return success("Estado del pago consultado correctamente", await mercadoPagoService.synchronizeOrder(orderId, accessToken))
  })
}
