import { apiRequest } from "@/services/api-client"

export type ReportSummary = {
  totals: { netSales: number; registeredPurchases: number; estimatedMargin: number; lowStockProducts: number }
  monthly: Array<{ month: string; key: string; sales: number; purchases: number }>
  categories: Array<{ name: string; value: number; percentage: number }>
  lowStock: Array<{ id: string; sku: string; name: string; stock: number; stockMin: number }>
  insights: { bestMonth: string; leadingCategory: string }
  marginBasis: string
}

export function getReportSummary(signal?: AbortSignal) {
  return apiRequest<ReportSummary>("/api/reports/summary", { signal })
}

export async function downloadReport(kind: "summary" | "sales" | "inventory" | "purchases") {
  const response = await fetch(`/api/reports/export/${kind}`, { cache: "no-store" })
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(payload?.message ?? "No fue posible exportar el reporte")
  }
  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement("a")
  link.href = url
  link.download = `ferreia-${kind}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
