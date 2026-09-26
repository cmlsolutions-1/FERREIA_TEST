import { orderService } from "@/server/modules/orders/order.service"
import { updateOrderSchema } from "@/server/modules/orders/order.schema"
import { requireAdmin } from "@/server/modules/auth/auth.service"
import { handleApi, success } from "@/server/shared/api-response"
import { idSchema, parseBody } from "@/server/shared/validation"
import { ApiError } from "@/server/shared/api-error"

export const runtime = "nodejs"
type Context = { params: Promise<{ id: string }> }
export async function GET(request: Request, context: Context) { return handleApi(async () => { const order = await orderService.get(idSchema.parse(await context.params).id); try { await requireAdmin(request) } catch { const email = new URL(request.url).searchParams.get("email")?.trim().toLowerCase(); if (!email || email !== order.email.toLowerCase()) throw new ApiError(401, "UNAUTHORIZED", "No tienes acceso a este pedido") } return success("Pedido obtenido correctamente", order) }) }
export async function PATCH(request: Request, context: Context) { return handleApi(async () => { await requireAdmin(request); return success("Pedido actualizado correctamente", await orderService.update(idSchema.parse(await context.params).id, await parseBody(request, updateOrderSchema))) }) }
