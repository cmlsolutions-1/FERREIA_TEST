import type { ApiSuccess } from "@/server/shared/api-response"

type AdminUser = { id: string; name: string; email: string }

export async function getAdminSession() {
  const response = await fetch("/api/auth/admin", { cache: "no-store" })
  return response.ok ? (await response.json() as ApiSuccess<AdminUser>).data : null
}

export async function signInAdmin(email: string, password: string) {
  const response = await fetch("/api/auth/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) })
  return response.ok
}

export async function signOutAdmin() {
  await fetch("/api/auth/admin", { method: "DELETE" })
}
