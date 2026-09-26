import { customersService } from "@/server/modules/customers/customer.service"
import { requireAdmin } from "@/server/modules/auth/auth.service"
import { handleApi, success } from "@/server/shared/api-response"
import { createCrmCustomerSchema } from "@/server/modules/customers/customer.schema"
import { parseBody } from "@/server/shared/validation"
export const runtime = "nodejs"
export async function GET(request: Request) { return handleApi(async () => { await requireAdmin(request); return success("Clientes obtenidos correctamente", await customersService.list()) }) }
export async function POST(request: Request) { return handleApi(async () => { await requireAdmin(request); const customer = await customersService.create(await parseBody(request, createCrmCustomerSchema)); return success("Cliente creado correctamente", customer, 201) }) }
