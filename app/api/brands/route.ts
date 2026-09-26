import { brandService } from "@/server/modules/brands/brand.service"
import { brandFiltersSchema, createBrandSchema } from "@/server/modules/brands/brand.schema"
import { requireAdmin } from "@/server/modules/auth/auth.service"
import { handleApi, success } from "@/server/shared/api-response"
import { parseBody, parseSearch } from "@/server/shared/validation"

export const runtime = "nodejs"
export async function GET(request: Request) { return handleApi(async () => { const result = await brandService.list(parseSearch(request, brandFiltersSchema)); return success("Marcas obtenidas correctamente", result.data, 200, result.meta) }) }
export async function POST(request: Request) { return handleApi(async () => { await requireAdmin(request); const data = await brandService.create(await parseBody(request, createBrandSchema)); return success("Marca creada correctamente", data, 201) }) }
