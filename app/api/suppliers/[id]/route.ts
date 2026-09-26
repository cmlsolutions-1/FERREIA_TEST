import { requireAdmin } from "@/server/modules/auth/auth.service"
import { supplierService } from "@/server/modules/suppliers/supplier.service"
import { updateSupplierSchema } from "@/server/modules/suppliers/supplier.schema"
import { handleApi, success } from "@/server/shared/api-response"
import { idSchema, parseBody } from "@/server/shared/validation"

export const runtime = "nodejs"
type Context = { params: Promise<{ id: string }> }
export async function GET(request: Request, { params }: Context) { return handleApi(async () => { await requireAdmin(request); return success("Proveedor obtenido correctamente", await supplierService.get(idSchema.parse(await params).id)) }) }
export async function PATCH(request: Request, { params }: Context) { return handleApi(async () => { await requireAdmin(request); const data = await supplierService.update(idSchema.parse(await params).id, await parseBody(request, updateSupplierSchema)); return success("Proveedor actualizado correctamente", data) }) }
export async function DELETE(request: Request, { params }: Context) { return handleApi(async () => { await requireAdmin(request); const data = await supplierService.remove(idSchema.parse(await params).id); return success("Proveedor desactivado correctamente", data) }) }
