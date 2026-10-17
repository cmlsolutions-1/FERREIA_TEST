import { trustsProxyHeaders } from "@/server/shared/request-security"

export function shouldSecureCookie(request: Request) {
  return new URL(request.url).protocol === "https:"
    || (trustsProxyHeaders() && request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https")
}
