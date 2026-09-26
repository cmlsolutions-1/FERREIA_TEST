import { purchaseService } from "@/server/modules/purchases/purchase.service"
import { savePurchaseSchema } from "@/server/modules/purchases/purchase.schema"
import { requireAdmin } from "@/server/modules/auth/auth.service"
import { handleApi, success } from "@/server/shared/api-response"
import { idSchema, parseBody } from "@/server/shared/validation"
export const runtime = "nodejs"
type Context = { params: Promise<{ id: string }> }
export async function GET(request: Request, context: Context) { return handleApi(async () => { await requireAdmin(request); return success("Orden de compra obtenida correctamente", await purchaseService.get(idSchema.parse(await context.params).id)) }) }
export async function PUT(request: Request, context: Context) { return handleApi(async () => { await requireAdmin(request); return success("Orden de compra guardada correctamente", await purchaseService.save(await parseBody(request, savePurchaseSchema), idSchema.parse(await context.params).id)) }) }
