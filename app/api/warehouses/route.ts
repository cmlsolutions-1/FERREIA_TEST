import { requireAdmin } from "@/server/modules/auth/auth.service"
import { warehouseService } from "@/server/modules/warehouses/warehouse.service"
import { createWarehouseSchema, warehouseFiltersSchema } from "@/server/modules/warehouses/warehouse.schema"
import { handleApi, success } from "@/server/shared/api-response"
import { parseBody, parseSearch } from "@/server/shared/validation"

export const runtime = "nodejs"

export async function GET(request: Request) {
  return handleApi(async () => {
    await requireAdmin(request)
    const result = await warehouseService.list(parseSearch(request, warehouseFiltersSchema))
    return success("Bodegas obtenidas correctamente", result.data, 200, result.meta)
  })
}

export async function POST(request: Request) {
  return handleApi(async () => {
    await requireAdmin(request)
    const warehouse = await warehouseService.create(await parseBody(request, createWarehouseSchema))
    return success("Bodega creada correctamente", warehouse, 201)
  })
}
