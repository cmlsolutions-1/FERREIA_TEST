import { categoryService } from "@/server/modules/categories/category.service"
import { categoryFiltersSchema, createCategorySchema } from "@/server/modules/categories/category.schema"
import { requireAdmin } from "@/server/modules/auth/auth.service"
import { handleApi, success } from "@/server/shared/api-response"
import { parseBody, parseSearch } from "@/server/shared/validation"

export const runtime = "nodejs"
export async function GET(request: Request) { return handleApi(async () => { const filters = parseSearch(request, categoryFiltersSchema); if (filters.admin) await requireAdmin(request); const result = await categoryService.list(filters); return success("Categorías obtenidas correctamente", result.data, 200, result.meta) }) }
export async function POST(request: Request) { return handleApi(async () => { await requireAdmin(request); const data = await categoryService.create(await parseBody(request, createCategorySchema)); return success("Categoría creada correctamente", data, 201) }) }
