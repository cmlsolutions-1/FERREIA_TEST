import { paymentService } from "@/server/modules/payments/payment.service"
import { requireAdmin } from "@/server/modules/auth/auth.service"
import { handleApi, success } from "@/server/shared/api-response"
import { idSchema } from "@/server/shared/validation"
export const runtime = "nodejs"
type Context = { params: Promise<{ id: string }> }
export async function GET(request: Request, context: Context) { return handleApi(async () => { await requireAdmin(request); return success("Pago obtenido correctamente", await paymentService.get(idSchema.parse(await context.params).id)) }) }
