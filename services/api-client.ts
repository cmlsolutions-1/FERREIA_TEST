export type ApiResponse<T> = { ok: true; message: string; data: T; meta?: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean } }
export type ApiFailure = { ok: false; message: string; error: { code: string; details?: unknown } }

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(path, { ...init, headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers }, cache: "no-store" })
  const payload = await response.json() as ApiResponse<T> | ApiFailure
  if (!response.ok || !payload.ok) throw new Error(payload.message)
  return payload
}
