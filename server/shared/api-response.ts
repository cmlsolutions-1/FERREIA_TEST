import { NextResponse } from "next/server"
import { toApiError } from "@/server/shared/api-error"

export type PaginationMeta = { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean }
export type ApiSuccess<T> = { ok: true; message: string; data: T; meta?: PaginationMeta }
export type ApiFailure = { ok: false; message: string; error: { code: string; details?: unknown } }

export function success<T>(message: string, data: T, status = 200, meta?: PaginationMeta) {
  return NextResponse.json<ApiSuccess<T>>({ ok: true, message, data, ...(meta ? { meta } : {}) }, { status })
}

export function failure(error: unknown) {
  const known = toApiError(error)
  return NextResponse.json<ApiFailure>({ ok: false, message: known.message, error: { code: known.code, ...(known.details === undefined ? {} : { details: known.details }) } }, { status: known.status })
}

export async function handleApi(action: () => Promise<NextResponse>) {
  try { return await action() } catch (error) { return failure(error) }
}
