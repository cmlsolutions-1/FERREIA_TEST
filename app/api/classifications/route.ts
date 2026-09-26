import { requireAdmin } from "@/server/modules/auth/auth.service"
import { classificationService } from "@/server/modules/classifications/classification.service"
import { classificationFiltersSchema, createClassificationSchema } from "@/server/modules/classifications/classification.schema"
import { handleApi, success } from "@/server/shared/api-response"
import { parseBody, parseSearch } from "@/server/shared/validation"

export const runtime = "nodejs"
export async function GET(request: Request) { return handleApi(async () => { await requireAdmin(request); const result = await classificationService.list(parseSearch(request, classificationFiltersSchema)); return success("Clasificaciones obtenidas correctamente", result.data, 200, result.meta) }) }
export async function POST(request: Request) { return handleApi(async () => { await requireAdmin(request); const data = await classificationService.create(await parseBody(request, createClassificationSchema)); return success("Clasificación creada correctamente", data, 201) }) }
