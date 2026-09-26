import { apiRequest } from "@/services/api-client"

export type ClassificationKind = "LINE" | "GROUP" | "SUBGROUP"
export type ClassificationRecord = { id: string; kind: ClassificationKind; name: string; parentId: string | null; active: boolean }

export async function getAllClassifications() {
  const items: ClassificationRecord[] = []
  for (let page = 1; ; page++) {
    const response = await apiRequest<ClassificationRecord[]>(`/api/classifications?page=${page}&limit=100`)
    items.push(...response.data)
    if (!response.meta?.hasNextPage) return items
  }
}
export function createClassification(input: Pick<ClassificationRecord, "kind" | "name" | "parentId">) {
  return apiRequest<ClassificationRecord>("/api/classifications", { method: "POST", body: JSON.stringify(input) })
}
export function updateClassification(id: string, input: Partial<Pick<ClassificationRecord, "name" | "active">>) {
  return apiRequest<ClassificationRecord>(`/api/classifications/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) })
}
