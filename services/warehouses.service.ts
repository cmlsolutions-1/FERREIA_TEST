import type { WarehouseRecord } from "@/lib/product-master"
import { apiRequest } from "@/services/api-client"

export async function getWarehouses(page = 1, limit = 100) {
  return apiRequest<WarehouseRecord[]>(`/api/warehouses?page=${page}&limit=${limit}`)
}

export async function getAllWarehouses() {
  const warehouses: WarehouseRecord[] = []
  for (let page = 1; ; page++) {
    const response = await getWarehouses(page)
    warehouses.push(...response.data)
    if (!response.meta?.hasNextPage) return warehouses
  }
}

export async function createWarehouse(input: Omit<WarehouseRecord, "id">) {
  return apiRequest<WarehouseRecord>("/api/warehouses", { method: "POST", body: JSON.stringify(input) })
}

export async function updateWarehouse(id: string, input: Partial<Omit<WarehouseRecord, "id">>) {
  return apiRequest<WarehouseRecord>(`/api/warehouses/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) })
}
