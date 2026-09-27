"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/admin/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCOP } from "@/lib/data"
import { BarChart3, Download, FileSpreadsheet, TrendingUp } from "lucide-react"
import { downloadReport, getReportSummary, type ReportSummary } from "@/services/reports.service"

const emptyReport: ReportSummary = {
  totals: { netSales: 0, registeredPurchases: 0, estimatedMargin: 0, lowStockProducts: 0 },
  monthly: [], categories: [], lowStock: [],
  insights: { bestMonth: "Sin ventas", leadingCategory: "Sin ventas" },
  marginBasis: "Costo actual de los productos asociados a cada línea vendida",
}

const availableReports = [
  { name: "Ventas detalladas", period: "Histórico", source: "Ventas y Pedidos", kind: "sales" as const },
  { name: "Inventario valorizado", period: "Actual", source: "Inventario", kind: "inventory" as const },
  { name: "Compras por proveedor", period: "Histórico", source: "Compras", kind: "purchases" as const },
]

export default function ReportesPage() {
  const [report, setReport] = useState<ReportSummary>(emptyReport)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    getReportSummary(controller.signal)
      .then((result) => setReport(result.data))
      .catch((reason) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "No fue posible cargar los reportes") })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])

  async function exportFile(kind: "summary" | "sales" | "inventory" | "purchases") {
    setExporting(kind)
    setError("")
    try { await downloadReport(kind) }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No fue posible exportar el reporte") }
    finally { setExporting(null) }
  }

  const chartMax = Math.max(1, ...report.monthly.flatMap((item) => [item.sales, item.purchases]))
  const millions = (value: number) => value ? (value / 1_000_000).toLocaleString("es-CO", { maximumFractionDigits: 1 }) : "0"

  return (
    <div>
      <PageHeader
        title="Reportes"
        description="Indicadores comerciales, rotación de inventario y documentos exportables"
        action={<Button variant="outline" size="sm" disabled={Boolean(exporting)} onClick={() => exportFile("summary")}><Download className="mr-2 h-4 w-4" />{exporting === "summary" ? "Exportando..." : "Exportar resumen"}</Button>}
      />

      {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {loading && <p className="mb-4 text-sm text-muted-foreground">Cargando indicadores desde PostgreSQL...</p>}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Ventas netas" value={formatCOP(report.totals.netSales)} />
        <Metric label="Compras registradas" value={formatCOP(report.totals.registeredPurchases)} />
        <Metric label="Margen estimado" value={formatCOP(report.totals.estimatedMargin)} className="text-emerald-600" title={report.marginBasis} />
        <Metric label="Alertas de stock" value={String(report.totals.lowStockProducts)} className="text-amber-600" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between"><CardTitle>Ventas vs compras</CardTitle><Badge variant="secondary" className="border-0 bg-secondary text-secondary-foreground">Millones COP</Badge></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.monthly.map((row) => <div key={row.key} className="grid grid-cols-[44px_1fr] items-center gap-3 text-sm"><span className="font-medium capitalize text-muted-foreground">{row.month}</span><div className="space-y-1.5"><div className="flex items-center gap-2"><div className="h-2 rounded-full bg-accent" style={{ width: `${(row.sales / chartMax) * 100}%` }} /><span className="w-12 text-xs text-muted-foreground">{millions(row.sales)}</span></div><div className="flex items-center gap-2"><div className="h-2 rounded-full bg-primary" style={{ width: `${(row.purchases / chartMax) * 100}%` }} /><span className="w-12 text-xs text-muted-foreground">{millions(row.purchases)}</span></div></div></div>)}
              {!report.monthly.length && !loading && <p className="py-8 text-center text-sm text-muted-foreground">No hay información mensual disponible.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Categorías vendidas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {report.categories.map((category) => <div key={category.name} className="space-y-1.5"><div className="flex items-center justify-between text-sm"><span className="font-medium text-foreground">{category.name}</span><span className="text-muted-foreground">{category.percentage}%</span></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-accent" style={{ width: `${category.percentage}%` }} /></div></div>)}
            {!report.categories.length && !loading && <p className="py-8 text-center text-sm text-muted-foreground">Todavía no hay ventas por categoría.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Reporte</TableHead><TableHead>Periodo</TableHead><TableHead>Origen</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acción</TableHead></TableRow></TableHeader><TableBody>{availableReports.map((item) => <TableRow key={item.kind}><TableCell className="font-medium">{item.name}</TableCell><TableCell className="text-sm">{item.period}</TableCell><TableCell className="text-sm">{item.source}</TableCell><TableCell><Badge variant="secondary" className="border-0 bg-emerald-100 text-emerald-800">Disponible</Badge></TableCell><TableCell className="text-right"><Button variant="ghost" size="sm" disabled={Boolean(exporting)} onClick={() => exportFile(item.kind)}><FileSpreadsheet className="mr-2 h-4 w-4" />{exporting === item.kind ? "Exportando..." : "CSV"}</Button></TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>

        <Card><CardContent className="space-y-3 p-4"><div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-accent" /><h2 className="font-semibold text-foreground">Lectura rápida</h2></div><div className="rounded-lg border border-border p-3 text-sm"><p className="flex items-center gap-2 font-medium text-emerald-700"><TrendingUp className="h-4 w-4" />Mes con mayor venta: <span className="capitalize">{report.insights.bestMonth}</span></p><p className="mt-1 text-muted-foreground">{report.insights.leadingCategory === "Sin ventas" ? "Todavía no hay ventas suficientes para identificar una categoría líder." : `${report.insights.leadingCategory} lidera las ventas registradas por categoría.`}</p></div>{report.lowStock.map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg bg-secondary p-3 text-sm"><span className="max-w-[180px] truncate">{item.name}</span><Badge variant="secondary" className="border-0 bg-amber-100 text-amber-800">{item.stock} / min {item.stockMin}</Badge></div>)}{!report.lowStock.length && !loading && <p className="text-sm text-muted-foreground">No hay artículos por debajo del mínimo.</p>}</CardContent></Card>
      </div>
    </div>
  )
}

function Metric({ label, value, className = "", title }: { label: string; value: string; className?: string; title?: string }) {
  return <Card title={title}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-xl font-bold ${className}`}>{value}</p></CardContent></Card>
}
