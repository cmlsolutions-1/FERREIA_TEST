import { mercadoPagoService, orderPaymentStatusSchema } from "@/server/modules/payments/mercado-pago.service"
import { handleApi, success } from "@/server/shared/api-response"
import { parseBody } from "@/server/shared/validation"

export const runtime = "nodejs"

export async function POST(request: Request) {
  return handleApi(async () => {
    const { orderId, email } = await parseBody(request, orderPaymentStatusSchema)
    return success("Estado del pago consultado correctamente", await mercadoPagoService.synchronizeOrder(orderId, email))
  })
}
