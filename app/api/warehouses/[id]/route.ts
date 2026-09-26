import { requireAdmin } from "@/server/modules/auth/auth.service"
import { warehouseService } from "@/server/modules/warehouses/warehouse.service"
import { updateWarehouseSchema, warehouseIdSchema } from "@/server/modules/warehouses/warehouse.schema"
import { handleApi, success } from "@/server/shared/api-response"
import { parseBody } from "@/server/shared/validation"

export const runtime = "nodejs"
type Context = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: Context) {
  return handleApi(async () => {
    await requireAdmin(request)
    const { id } = warehouseIdSchema.parse(await context.params)
    return success("Bodega obtenida correctamente", await warehouseService.get(id))
  })
}

export async function PATCH(request: Request, context: Context) {
  return handleApi(async () => {
    await requireAdmin(request)
    const { id } = warehouseIdSchema.parse(await context.params)
    return success("Bodega actualizada correctamente", await warehouseService.update(id, await parseBody(request, updateWarehouseSchema)))
  })
}

export async function DELETE(request: Request, context: Context) {
  return handleApi(async () => {
    await requireAdmin(request)
    const { id } = warehouseIdSchema.parse(await context.params)
    await warehouseService.remove(id)
    return success("Bodega desactivada correctamente", { id, active: false })
  })
}
