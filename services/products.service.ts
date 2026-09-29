import type { Product } from "@/lib/data"
import type { ProductMaster } from "@/lib/product-master"
import { apiRequest, type ApiFailure, type ApiResponse } from "@/services/api-client"
import { PRODUCT_IMAGE_UPLOAD_ENDPOINT } from "@/lib/upload-paths"

export type ProductRecord = ProductMaster & Product & { categoryName: string; brandId: string; warehouseId: string | null; basePrice: number; basePriceTiers: Product["priceTiers"]; images: string[] }
export type ProductFilters = { page?: number; limit?: number; search?: string; category?: string; brand?: string; productType?: ProductRecord["productType"]; minPrice?: number; maxPrice?: number; active?: boolean; admin?: boolean; sort?: "name" | "price-asc" | "price-desc" | "newest" | "stock" }

export async function getProducts(filters: ProductFilters = {}) {
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)]))
  return apiRequest<ProductRecord[]>(`/api/products?${query}`)
}
export async function getAllProducts(filters: Omit<ProductFilters, "page" | "limit"> = {}) {
  const all: ProductRecord[] = []
  for (let page = 1; ; page++) {
    const response = await getProducts({ ...filters, page, limit: 100 })
    all.push(...response.data)
    if (!response.meta?.hasNextPage) return all
  }
}
export async function getProductById(id: string, admin = false) { return apiRequest<ProductRecord>(`/api/products/${encodeURIComponent(id)}${admin ? "?admin=true" : ""}`) }
export async function createProduct(input: unknown) { return apiRequest<ProductRecord>("/api/products", { method: "POST", body: JSON.stringify(input) }) }
export async function updateProduct(id: string, input: unknown) { return apiRequest<ProductRecord>(`/api/products/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) }) }
export async function deactivateProduct(id: string) { return apiRequest<{ deleted: boolean }>(`/api/products/${encodeURIComponent(id)}`, { method: "DELETE" }) }

export async function uploadProductImage(file: File) {
  const body = new FormData()
  body.set("file", file)
  const response = await fetch(PRODUCT_IMAGE_UPLOAD_ENDPOINT, { method: "POST", body, cache: "no-store" })
  const payload = await response.json() as ApiResponse<{ url: string; filename: string; storage: "spaces" }> | ApiFailure
  if (!response.ok || !payload.ok) throw new Error(payload.message)
  return payload.data.url
}
