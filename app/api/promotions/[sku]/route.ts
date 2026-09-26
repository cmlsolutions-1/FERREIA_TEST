import { promotionService } from "@/server/modules/promotions/promotion.service"
import { requireAdmin } from "@/server/modules/auth/auth.service"
import { handleApi, success } from "@/server/shared/api-response"
import { idSchema } from "@/server/shared/validation"
export const runtime = "nodejs"
type Context = { params: Promise<{ sku: string }> }
export async function DELETE(request: Request, context: Context) { return handleApi(async () => { await requireAdmin(request); const { sku } = await context.params; idSchema.parse({ id: sku }); await promotionService.remove(sku); return success("Promoción eliminada correctamente", { deleted: true }) }) }
