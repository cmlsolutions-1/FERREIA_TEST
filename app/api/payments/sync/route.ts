import { mercadoPagoService, synchronizePaymentSchema } from "@/server/modules/payments/mercado-pago.service"
import { handleApi, success } from "@/server/shared/api-response"
import { parseBody } from "@/server/shared/validation"

export const runtime = "nodejs"

export async function POST(request: Request) {
  return handleApi(async () => {
    const input = await parseBody(request, synchronizePaymentSchema)
    const payment = await mercadoPagoService.synchronize(input.paymentId)
    return success("Estado del pago sincronizado correctamente", {
      id: payment.id,
      orderId: payment.orderId ?? payment.externalReference,
      status: payment.status,
      statusDetail: payment.statusDetail,
    })
  })
}
