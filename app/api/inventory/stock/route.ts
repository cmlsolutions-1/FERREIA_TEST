import { requireAdmin } from "@/server/modules/auth/auth.service"
import { stockService } from "@/server/modules/inventory/stock.service"
import { stockFiltersSchema } from "@/server/modules/inventory/stock.schema"
import { handleApi, success } from "@/server/shared/api-response"
import { parseSearch } from "@/server/shared/validation"

export const runtime = "nodejs"

export async function GET(request: Request) {
  return handleApi(async () => {
    await requireAdmin(request)
    const result = await stockService.list(parseSearch(request, stockFiltersSchema))
    return success("Existencias obtenidas correctamente", result.data, 200, result.meta)
  })
}
