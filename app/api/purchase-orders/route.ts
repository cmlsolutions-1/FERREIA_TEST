import { purchaseService } from "@/server/modules/purchases/purchase.service"
import { purchaseFiltersSchema, savePurchaseSchema } from "@/server/modules/purchases/purchase.schema"
import { requireAdmin } from "@/server/modules/auth/auth.service"
import { handleApi, success } from "@/server/shared/api-response"
import { parseBody, parseSearch } from "@/server/shared/validation"
export const runtime = "nodejs"
export async function GET(request: Request) { return handleApi(async () => { await requireAdmin(request); const result = await purchaseService.list(parseSearch(request, purchaseFiltersSchema)); return success("Órdenes de compra obtenidas correctamente", result.data, 200, result.meta) }) }
export async function POST(request: Request) { return handleApi(async () => { await requireAdmin(request); return success("Orden de compra creada correctamente", await purchaseService.save(await parseBody(request, savePurchaseSchema)), 201) }) }
