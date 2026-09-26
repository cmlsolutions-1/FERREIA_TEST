import type { Product } from "@/lib/data"
import type { ProductMaster } from "@/lib/product-master"
import { apiRequest } from "@/services/api-client"

export type ProductRecord = ProductMaster & Product & { categoryName: string; brandId: string; warehouseId: string | null; basePrice: number; images: string[] }
export type ProductFilters = { page?: number; limit?: number; search?: string; category?: string; brand?: string; minPrice?: number; maxPrice?: number; active?: boolean; admin?: boolean; sort?: "name" | "price-asc" | "price-desc" | "newest" | "stock" }

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
