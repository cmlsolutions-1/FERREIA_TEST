import { loginAdmin, logoutAdmin, requireAdmin, setAdminCookie, clearAdminCookie } from "@/server/modules/auth/auth.service"
import { adminLoginSchema } from "@/server/modules/auth/auth.schema"
import { handleApi, success } from "@/server/shared/api-response"
import { parseBody } from "@/server/shared/validation"

export const runtime = "nodejs"

export async function GET(request: Request) {
  return handleApi(async () => success("Sesión administrativa activa", await requireAdmin(request)))
}

export async function POST(request: Request) {
  return handleApi(async () => {
    const { email, password } = await parseBody(request, adminLoginSchema)
    const result = await loginAdmin(email, password)
    return setAdminCookie(success("Sesión iniciada correctamente", result.user), result.token, request)
  })
}

export async function DELETE(request: Request) {
  return handleApi(async () => {
    await logoutAdmin(request)
    return clearAdminCookie(success("Sesión cerrada correctamente", null), request)
  })
}
