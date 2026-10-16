import type { Category } from "@/lib/data"
import { apiRequest } from "@/services/api-client"
export type CategoryRecord = Category & { id: string; active: boolean; parentId: string | null }
export async function getCategories(limit = 100, admin = false) { return apiRequest<CategoryRecord[]>(`/api/categories?limit=${limit}${admin ? "&admin=true" : ""}`) }
export async function getAllCategories(admin = false) {
  const categories: CategoryRecord[] = []
  for (let page = 1; ; page++) {
    const response = await apiRequest<CategoryRecord[]>(`/api/categories?page=${page}&limit=100${admin ? "&admin=true" : "&active=true"}`)
    categories.push(...response.data)
    if (!response.meta?.hasNextPage) return categories
  }
}
