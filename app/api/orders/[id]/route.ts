import { orderService } from "@/server/modules/orders/order.service"
import { updateOrderSchema } from "@/server/modules/orders/order.schema"
import { requireAdmin } from "@/server/modules/auth/auth.service"
import { handleApi, success } from "@/server/shared/api-response"
import { idSchema, parseBody } from "@/server/shared/validation"
import { ApiError } from "@/server/shared/api-error"
import { customerService } from "@/server/modules/auth/customer.service"
import { assertRateLimit } from "@/server/shared/request-security"

export const runtime = "nodejs"
type Context = { params: Promise<{ id: string }> }
export async function GET(request: Request, context: Context) { return handleApi(async () => {
  assertRateLimit(request, "order-read", { limit: 60, windowMs: 10 * 60_000 })
  const id = idSchema.parse(await context.params).id
  const order = await orderService.get(id)
  try { await requireAdmin(request); return success("Pedido obtenido correctamente", order) } catch {}
  try {
    const customer = await customerService.current(request)
    if (order.customerId === customer.id) return success("Pedido obtenido correctamente", order)
  } catch {}
  const token = request.headers.get("x-order-access-token") ?? ""
  if (!await orderService.verifyAccessToken(id, token)) throw new ApiError(401, "UNAUTHORIZED", "No tienes acceso a este pedido")
  return success("Pedido obtenido correctamente", order)
}) }
export async function PATCH(request: Request, context: Context) { return handleApi(async () => { await requireAdmin(request); return success("Pedido actualizado correctamente", await orderService.update(idSchema.parse(await context.params).id, await parseBody(request, updateOrderSchema))) }) }
