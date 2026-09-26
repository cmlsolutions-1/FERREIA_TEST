import { customerService } from "@/server/modules/auth/customer.service"
import { customerLoginSchema, customerRegisterSchema } from "@/server/modules/auth/customer.schema"
import { handleApi, success } from "@/server/shared/api-response"
import { parseBody } from "@/server/shared/validation"
export const runtime = "nodejs"
export async function GET(request: Request) { return handleApi(async () => success("Sesión de cliente activa", await customerService.current(request))) }
export async function POST(request: Request) { return handleApi(async () => { const { email, password } = await parseBody(request, customerLoginSchema); const result = await customerService.login(email, password); return customerService.setCookie(success("Sesión iniciada correctamente", result.user), result.token, request) }) }
export async function PUT(request: Request) { return handleApi(async () => { const result = await customerService.register(await parseBody(request, customerRegisterSchema)); return customerService.setCookie(success("Cuenta creada correctamente", result.user, 201), result.token, request) }) }
export async function DELETE(request: Request) { return handleApi(async () => { await customerService.logout(request); return customerService.clearCookie(success("Sesión cerrada correctamente", null), request) }) }
