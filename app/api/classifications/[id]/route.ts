import { requireAdmin } from "@/server/modules/auth/auth.service"
import { classificationService } from "@/server/modules/classifications/classification.service"
import { updateClassificationSchema } from "@/server/modules/classifications/classification.schema"
import { handleApi, success } from "@/server/shared/api-response"
import { idSchema, parseBody } from "@/server/shared/validation"

export const runtime = "nodejs"
type Context = { params: Promise<{ id: string }> }
export async function GET(request: Request, { params }: Context) { return handleApi(async () => { await requireAdmin(request); return success("Clasificación obtenida correctamente", await classificationService.get(idSchema.parse(await params).id)) }) }
export async function PATCH(request: Request, { params }: Context) { return handleApi(async () => { await requireAdmin(request); const data = await classificationService.update(idSchema.parse(await params).id, await parseBody(request, updateClassificationSchema)); return success("Clasificación actualizada correctamente", data) }) }
