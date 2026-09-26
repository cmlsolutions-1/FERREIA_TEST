import { orderService } from "@/server/modules/orders/order.service"
import { createOrderSchema, orderFiltersSchema } from "@/server/modules/orders/order.schema"
import { requireAdmin } from "@/server/modules/auth/auth.service"
import { handleApi, success } from "@/server/shared/api-response"
import { parseBody, parseSearch } from "@/server/shared/validation"
import { customerService } from "@/server/modules/auth/customer.service"

export const runtime = "nodejs"
export async function GET(request: Request) { return handleApi(async () => { await requireAdmin(request); const result = await orderService.list(parseSearch(request, orderFiltersSchema)); return success("Pedidos obtenidos correctamente", result.data, 200, result.meta) }) }
export async function POST(request: Request) { return handleApi(async () => { const input = await parseBody(request, createOrderSchema); let customerId: string | null = null; try { customerId = (await customerService.current(request)).id } catch {} return success("Pedido creado correctamente", await orderService.create(input, customerId), 201) }) }
