import type { Category } from "@/lib/data"
import { apiRequest } from "@/services/api-client"
export type CategoryRecord = Category & { id: string; active: boolean; parentId: string | null }
export async function getCategories(limit = 100) { return apiRequest<CategoryRecord[]>(`/api/categories?limit=${limit}`) }
export async function getAllCategories() {
  const categories: CategoryRecord[] = []
  for (let page = 1; ; page++) {
    const response = await apiRequest<CategoryRecord[]>(`/api/categories?page=${page}&limit=100&active=true`)
    categories.push(...response.data)
    if (!response.meta?.hasNextPage) return categories
  }
}
