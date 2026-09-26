import { apiRequest } from "@/services/api-client"
export type BrandRecord = { id: string; name: string; country: string; active: boolean; productCount: number }
export async function getBrands(limit = 100) { return apiRequest<BrandRecord[]>(`/api/brands?limit=${limit}`) }
export async function getAllBrands() {
  const brands: BrandRecord[] = []
  for (let page = 1; ; page++) {
    const response = await apiRequest<BrandRecord[]>(`/api/brands?page=${page}&limit=100`)
    brands.push(...response.data)
    if (!response.meta?.hasNextPage) return brands
  }
}
export function createBrand(input: Pick<BrandRecord, "name" | "country">) {
  return apiRequest<BrandRecord>("/api/brands", { method: "POST", body: JSON.stringify(input) })
}
export function updateBrand(id: string, input: Partial<Pick<BrandRecord, "name" | "country" | "active">>) {
  return apiRequest<BrandRecord>(`/api/brands/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) })
}
