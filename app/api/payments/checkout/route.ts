import { mercadoPagoService, checkoutPreferenceSchema } from "@/server/modules/payments/mercado-pago.service"
import { handleApi, success } from "@/server/shared/api-response"
import { parseBody } from "@/server/shared/validation"

export const runtime = "nodejs"

export async function POST(request: Request) {
  return handleApi(async () => {
    const input = await parseBody(request, checkoutPreferenceSchema)
    return success("Checkout de Mercado Pago creado correctamente", await mercadoPagoService.createPreference(input.orderId, input.email), 201)
  })
}
