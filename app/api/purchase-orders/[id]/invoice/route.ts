import { purchaseService } from "@/server/modules/purchases/purchase.service"
import { approveInvoiceSchema } from "@/server/modules/purchases/purchase.schema"
import { requireAdmin } from "@/server/modules/auth/auth.service"
import { handleApi, success } from "@/server/shared/api-response"
import { idSchema, parseBody } from "@/server/shared/validation"
export const runtime = "nodejs"
type Context = { params: Promise<{ id: string }> }
export async function POST(request: Request, context: Context) { return handleApi(async () => { await requireAdmin(request); return success("Recepción y factura aprobadas correctamente", await purchaseService.approve(idSchema.parse(await context.params).id, await parseBody(request, approveInvoiceSchema)), 201) }) }
