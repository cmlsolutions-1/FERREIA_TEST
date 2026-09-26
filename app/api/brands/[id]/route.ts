import { brandService } from "@/server/modules/brands/brand.service"
import { updateBrandSchema } from "@/server/modules/brands/brand.schema"
import { requireAdmin } from "@/server/modules/auth/auth.service"
import { handleApi, success } from "@/server/shared/api-response"
import { idSchema, parseBody } from "@/server/shared/validation"

export const runtime = "nodejs"
type Context = { params: Promise<{ id: string }> }
export async function GET(_request: Request, { params }: Context) { return handleApi(async () => success("Marca obtenida correctamente", await brandService.get(idSchema.parse(await params).id))) }
export async function PATCH(request: Request, { params }: Context) { return handleApi(async () => { await requireAdmin(request); const data = await brandService.update(idSchema.parse(await params).id, await parseBody(request, updateBrandSchema)); return success("Marca actualizada correctamente", data) }) }
export async function DELETE(request: Request, { params }: Context) { return handleApi(async () => { await requireAdmin(request); await brandService.remove(idSchema.parse(await params).id); return success("Marca eliminada correctamente", null) }) }
