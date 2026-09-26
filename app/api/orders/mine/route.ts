import { customerService } from "@/server/modules/auth/customer.service"
import { orderService } from "@/server/modules/orders/order.service"
import { handleApi, success } from "@/server/shared/api-response"
export const runtime = "nodejs"
export async function GET(request: Request) { return handleApi(async () => { const user = await customerService.current(request); const result = await orderService.listForCustomer(user.id, user.email); return success("Pedidos del cliente obtenidos correctamente", result) }) }
