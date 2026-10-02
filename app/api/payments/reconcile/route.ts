import { requireAdmin } from "@/server/modules/auth/auth.service"
import { mercadoPagoService } from "@/server/modules/payments/mercado-pago.service"
import { handleApi, success } from "@/server/shared/api-response"

export const runtime = "nodejs"

export async function POST(request: Request) {
  return handleApi(async () => {
    await requireAdmin(request)
    return success("Pagos recientes conciliados correctamente", await mercadoPagoService.reconcileRecent())
  })
}
