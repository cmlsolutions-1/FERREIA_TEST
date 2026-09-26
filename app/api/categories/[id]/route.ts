import { categoryService } from "@/server/modules/categories/category.service"
import { updateCategorySchema } from "@/server/modules/categories/category.schema"
import { requireAdmin } from "@/server/modules/auth/auth.service"
import { handleApi, success } from "@/server/shared/api-response"
import { idSchema, parseBody } from "@/server/shared/validation"

export const runtime = "nodejs"
type Context = { params: Promise<{ id: string }> }
export async function GET(_request: Request, { params }: Context) { return handleApi(async () => success("Categoría obtenida correctamente", await categoryService.get(idSchema.parse(await params).id))) }
export async function PATCH(request: Request, { params }: Context) { return handleApi(async () => { await requireAdmin(request); const data = await categoryService.update(idSchema.parse(await params).id, await parseBody(request, updateCategorySchema)); return success("Categoría actualizada correctamente", data) }) }
export async function DELETE(request: Request, { params }: Context) { return handleApi(async () => { await requireAdmin(request); await categoryService.remove(idSchema.parse(await params).id); return success("Categoría eliminada correctamente", null) }) }
