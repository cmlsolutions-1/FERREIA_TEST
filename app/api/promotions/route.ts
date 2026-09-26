import { promotionService } from "@/server/modules/promotions/promotion.service"
import { promotionSchema } from "@/server/modules/promotions/promotion.schema"
import { requireAdmin } from "@/server/modules/auth/auth.service"
import { handleApi, success } from "@/server/shared/api-response"
import { parseBody } from "@/server/shared/validation"
export const runtime = "nodejs"
export async function GET() { return handleApi(async () => success("Promociones obtenidas correctamente", await promotionService.list())) }
export async function POST(request: Request) { return handleApi(async () => { await requireAdmin(request); return success("Promoción guardada correctamente", await promotionService.save(await parseBody(request, promotionSchema)), 201) }) }
