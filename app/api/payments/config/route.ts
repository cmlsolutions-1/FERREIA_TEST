import { requireAdmin } from "@/server/modules/auth/auth.service"
import { mercadoPagoService } from "@/server/modules/payments/mercado-pago.service"
import { handleApi, success } from "@/server/shared/api-response"

export const runtime = "nodejs"

export async function GET(request: Request) {
  return handleApi(async () => {
    await requireAdmin(request)
    return success("Configuración de Mercado Pago obtenida correctamente", mercadoPagoService.configuration())
  })
}
