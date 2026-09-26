import { requireAdmin } from "@/server/modules/auth/auth.service"
import { stockService } from "@/server/modules/inventory/stock.service"
import { stockSummaryFiltersSchema } from "@/server/modules/inventory/stock.schema"
import { handleApi, success } from "@/server/shared/api-response"
import { parseSearch } from "@/server/shared/validation"

export const runtime = "nodejs"

export async function GET(request: Request) {
  return handleApi(async () => {
    await requireAdmin(request)
    return success("Resumen de inventario obtenido correctamente", await stockService.summary(parseSearch(request, stockSummaryFiltersSchema)))
  })
}
