import { mercadoPagoService, checkoutPreferenceSchema } from "@/server/modules/payments/mercado-pago.service"
import { handleApi, success } from "@/server/shared/api-response"
import { parseBody } from "@/server/shared/validation"
import { assertRateLimit } from "@/server/shared/request-security"

export const runtime = "nodejs"

export async function POST(request: Request) {
  return handleApi(async () => {
    assertRateLimit(request, "payment-checkout", { limit: 10, windowMs: 15 * 60_000 })
    const input = await parseBody(request, checkoutPreferenceSchema)
    return success("Checkout de Mercado Pago creado correctamente", await mercadoPagoService.createPreference(input.orderId, input.accessToken), 201)
  })
}
