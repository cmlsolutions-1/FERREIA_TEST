import { paymentService } from "@/server/modules/payments/payment.service"
import { paymentFiltersSchema } from "@/server/modules/payments/payment.schema"
import { requireAdmin } from "@/server/modules/auth/auth.service"
import { handleApi, success } from "@/server/shared/api-response"
import { parseSearch } from "@/server/shared/validation"
export const runtime = "nodejs"
export async function GET(request: Request) { return handleApi(async () => { await requireAdmin(request); const result = await paymentService.list(parseSearch(request, paymentFiltersSchema)); return success("Pagos obtenidos correctamente", result.data, 200, result.meta) }) }
