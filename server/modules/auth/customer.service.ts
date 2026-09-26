import { createHash, randomBytes } from "node:crypto"
import { NextResponse } from "next/server"
import { shouldSecureCookie } from "@/server/shared/cookie-security"
import { authRepository } from "@/server/modules/auth/auth.repository"
import { customerRepository } from "@/server/modules/customers/customer.repository"
import { ApiError } from "@/server/shared/api-error"
import { hashPassword, verifyPassword } from "@/server/shared/password"

const COOKIE = "ferreia_customer_session"
const DAYS = 30
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex")
const cookie = (request: Request) => request.headers.get("cookie")?.split(";").map((value) => value.trim()).find((value) => value.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1) ?? ""
const publicUser = (user: { id: string; name: string; document: string; email: string; phone: string; createdAt: Date }) => ({ id: user.id, name: user.name, document: user.document, email: user.email, phone: user.phone, createdAt: user.createdAt.toISOString() })
async function session(user: { id: string; name: string; document: string; email: string; phone: string; createdAt: Date }) { const token = randomBytes(32).toString("base64url"); await authRepository.createSession(user.id, tokenHash(token), new Date(Date.now() + DAYS * 86400000)); return { token, user: publicUser(user) } }
export const customerService = {
  async login(email: string, password: string) { const user = await authRepository.findByEmail(email.trim().toLowerCase()); if (!user || !user.active || user.role !== "CUSTOMER" || !user.passwordHash || !verifyPassword(password, user.passwordHash)) throw new ApiError(401, "UNAUTHORIZED", "El correo o la contraseña no coinciden"); return session(user) },
  async register(input: { name: string; document: string; email: string; phone: string; password: string }) { const user = await customerRepository.create({ id: `USR-${crypto.randomUUID()}`, name: input.name, document: input.document, email: input.email.trim().toLowerCase(), phone: input.phone, passwordHash: hashPassword(input.password) }); return session(user) },
  async current(request: Request) { const token = cookie(request); if (!token) throw new ApiError(401, "UNAUTHORIZED", "Debes iniciar sesión"); const found = await authRepository.findSession(tokenHash(token)); if (!found || found.expiresAt < new Date() || !found.user.active || found.user.role !== "CUSTOMER") throw new ApiError(401, "UNAUTHORIZED", "La sesión ha vencido"); return publicUser(found.user) },
  async logout(request: Request) { const token = cookie(request); if (token) await authRepository.deleteSession(tokenHash(token)) },
  setCookie(response: NextResponse, token: string, request: Request) { response.cookies.set(COOKIE, token, { httpOnly: true, secure: shouldSecureCookie(request), sameSite: "lax", path: "/", maxAge: DAYS * 86400 }); return response },
  clearCookie(response: NextResponse, request: Request) { response.cookies.set(COOKIE, "", { httpOnly: true, secure: shouldSecureCookie(request), sameSite: "lax", path: "/", maxAge: 0 }); return response },
}
