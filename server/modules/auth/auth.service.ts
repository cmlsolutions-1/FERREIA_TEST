import { createHash, randomBytes } from "node:crypto"
import { NextResponse } from "next/server"
import { authRepository } from "@/server/modules/auth/auth.repository"
import { ApiError } from "@/server/shared/api-error"
import { verifyPassword } from "@/server/shared/password"
import { shouldSecureCookie } from "@/server/shared/cookie-security"
import { assertTrustedOrigin } from "@/server/shared/request-security"

const COOKIE_NAME = "ferreia_admin_session"
const ADMIN_SESSION_DURATION_MS = 8 * 60 * 60 * 1000

function tokenHash(token: string) { return createHash("sha256").update(token).digest("hex") }
function getCookie(request: Request) {
  const header = request.headers.get("cookie") ?? ""
  const item = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`))
  return item?.slice(COOKIE_NAME.length + 1) ?? ""
}

export async function loginAdmin(email: string, password: string) {
  const user = await authRepository.findByEmail(email.trim().toLowerCase())
  if (!user || user.role !== "ADMIN" || !user.active || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    throw new ApiError(401, "UNAUTHORIZED", "El correo o la contraseña no coinciden")
  }
  const token = randomBytes(32).toString("base64url")
  await authRepository.createSession(user.id, tokenHash(token), new Date(Date.now() + ADMIN_SESSION_DURATION_MS))
  return { token, user: { id: user.id, name: user.name, email: user.email } }
}

export async function requireAdmin(request: Request) {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) assertTrustedOrigin(request)
  const token = getCookie(request)
  if (!token) throw new ApiError(401, "UNAUTHORIZED", "Debes iniciar sesión como administrador")
  const session = await authRepository.findSession(tokenHash(token))
  if (!session) throw new ApiError(401, "UNAUTHORIZED", "La sesión ha vencido")
  const now = Date.now()
  const expired = session.expiresAt.getTime() <= now
    || session.createdAt.getTime() + ADMIN_SESSION_DURATION_MS <= now
  if (expired || !session.user.active) {
    await authRepository.deleteSession(tokenHash(token))
    throw new ApiError(401, "UNAUTHORIZED", "La sesión ha vencido")
  }
  if (session.user.role !== "ADMIN") throw new ApiError(403, "FORBIDDEN", "No tienes permiso para esta operación")
  return { id: session.user.id, name: session.user.name, email: session.user.email }
}

export async function logoutAdmin(request: Request) {
  assertTrustedOrigin(request)
  const token = getCookie(request)
  if (token) await authRepository.deleteSession(tokenHash(token))
}

export function setAdminCookie(response: NextResponse, token: string, request: Request) {
  response.cookies.set(COOKIE_NAME, token, { httpOnly: true, secure: shouldSecureCookie(request), sameSite: "strict", priority: "high", path: "/" })
  return response
}

export function refreshAdminCookie(response: NextResponse, request: Request) {
  const token = getCookie(request)
  return token ? setAdminCookie(response, token, request) : response
}

export function clearAdminCookie(response: NextResponse, request: Request) {
  response.cookies.set(COOKIE_NAME, "", { httpOnly: true, secure: shouldSecureCookie(request), sameSite: "strict", priority: "high", path: "/", maxAge: 0 })
  return response
}
