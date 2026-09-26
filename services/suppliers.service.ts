import { apiRequest } from "@/services/api-client"

export type SupplierRecord = {
  id: string; name: string; nit: string; contact: string; city: string;
  category: string; commercialTerms: string; active: boolean; balance: number;
  productCount: number; purchaseOrderCount: number; createdAt: string; updatedAt: string;
}
export type SupplierInput = Pick<SupplierRecord, "name" | "nit" | "contact" | "city" | "category" | "commercialTerms">
export type SupplierSummary = { activeSuppliers: number; references: number; balance: number; purchaseOrders: number }

export function getSuppliers(page = 1, limit = 20, search = "") {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (search.trim()) params.set("search", search.trim())
  return apiRequest<SupplierRecord[]>(`/api/suppliers?${params}`)
}
export async function getAllSuppliers() {
  const all: SupplierRecord[] = []
  for (let page = 1; ; page++) {
    const result = await getSuppliers(page, 100)
    all.push(...result.data)
    if (!result.meta?.hasNextPage) return all
  }
}
export function getSupplierSummary() { return apiRequest<SupplierSummary>("/api/suppliers/summary") }
export function createSupplier(input: SupplierInput) { return apiRequest<SupplierRecord>("/api/suppliers", { method: "POST", body: JSON.stringify(input) }) }
export function updateSupplier(id: string, input: Partial<SupplierInput> & { active?: boolean }) { return apiRequest<SupplierRecord>(`/api/suppliers/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) }) }
