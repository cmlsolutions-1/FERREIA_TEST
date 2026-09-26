import "server-only"
import type { ApiResponse } from "@/services/api-client"

export async function serverApiRequest<T>(path: string): Promise<ApiResponse<T>> {
  const port = process.env.PORT ?? "3000"
  const response = await fetch(`http://127.0.0.1:${port}${path}`, { cache: "no-store" })
  if (!response.ok) throw new Error(`API request failed: ${response.status}`)
  return response.json() as Promise<ApiResponse<T>>
}
