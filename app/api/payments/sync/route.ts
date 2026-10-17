import { mercadoPagoService, synchronizePaymentSchema } from "@/server/modules/payments/mercado-pago.service"
import { handleApi, success } from "@/server/shared/api-response"
import { parseBody } from "@/server/shared/validation"
import { assertRateLimit } from "@/server/shared/request-security"

export const runtime = "nodejs"

export async function POST(request: Request) {
  return handleApi(async () => {
    assertRateLimit(request, "payment-sync", { limit: 20, windowMs: 10 * 60_000 })
    const input = await parseBody(request, synchronizePaymentSchema)
    const payment = await mercadoPagoService.synchronizeAuthorized(input.paymentId, input.orderId, input.accessToken)
    return success("Estado del pago sincronizado correctamente", {
      id: payment.id,
      orderId: payment.orderId ?? payment.externalReference,
      status: payment.status,
      statusDetail: payment.statusDetail,
    })
  })
}
