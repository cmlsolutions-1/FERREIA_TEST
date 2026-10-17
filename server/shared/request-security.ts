import { ApiError } from "@/server/shared/api-error"

type Bucket = { count: number; resetAt: number }
type RateLimitOptions = { limit: number; windowMs: number }

const globalBuckets = globalThis as typeof globalThis & { __ferreiaRateLimits?: Map<string, Bucket> }
const buckets = globalBuckets.__ferreiaRateLimits ??= new Map<string, Bucket>()

export function trustsProxyHeaders() {
  return process.env.TRUST_PROXY?.trim().toLowerCase() === "true"
}

function clientAddress(request: Request) {
  if (!trustsProxyHeaders()) return "untrusted-proxy"
  return request.headers.get("cf-connecting-ip")?.trim()
    || request.headers.get("x-real-ip")?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown-proxy-client"
}

export function assertRateLimit(request: Request, scope: string, options: RateLimitOptions) {
  const now = Date.now()
  const key = `${scope}:${clientAddress(request)}`
  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs })
  } else {
    current.count += 1
    if (current.count > options.limit) {
      throw new ApiError(429, "RATE_LIMITED", "Demasiadas solicitudes. Intenta nuevamente más tarde")
    }
  }

  if (buckets.size > 10_000) {
    for (const [bucketKey, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(bucketKey)
  }
}

export function assertTrustedOrigin(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    throw new ApiError(403, "UNTRUSTED_ORIGIN", "El origen de la solicitud no está autorizado")
  }

  const origin = request.headers.get("origin")
  if (!origin) return

  const allowed = new Set([new URL(request.url).origin])
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (configuredUrl) {
    try { allowed.add(new URL(configuredUrl).origin) } catch { /* La configuración inválida no amplía los orígenes permitidos. */ }
  }
  if (trustsProxyHeaders()) {
    const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim()
    const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
    if (host && (protocol === "http" || protocol === "https")) allowed.add(`${protocol}://${host}`)
  }
  if (!allowed.has(origin)) throw new ApiError(403, "UNTRUSTED_ORIGIN", "El origen de la solicitud no está autorizado")
}

export function assertContentLength(request: Request, maxBytes: number) {
  const raw = request.headers.get("content-length")
  if (raw && Number(raw) > maxBytes) throw new ApiError(413, "PAYLOAD_TOO_LARGE", "La solicitud supera el tamaño permitido")
}
