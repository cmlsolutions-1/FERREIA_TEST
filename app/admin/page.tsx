"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/admin/page-header"
import { DashboardCharts } from "@/components/admin/dashboard-charts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCOP } from "@/lib/data"
import { useOrders } from "@/components/order-provider"
import { type OrderStatus } from "@/lib/orders"
import { AlertTriangle, Download } from "lucide-react"
import { downloadReport, getReportSummary, type ReportSummary } from "@/services/reports.service"

const emptyReport: ReportSummary = {
  totals: { netSales: 0, registeredPurchases: 0, estimatedMargin: 0, lowStockProducts: 0 },
  monthly: [], categories: [], lowStock: [], insights: { bestMonth: "Sin ventas", leadingCategory: "Sin ventas" },
  marginBasis: "Costo actual de los productos asociados a cada línea vendida",
}

function statusColor(status: OrderStatus) { return status === "Cancelado" ? "bg-rose-100 text-rose-800" : status === "Entregado" ? "bg-emerald-100 text-emerald-800" : ["Enviado", "En centro de distribución", "En tránsito", "En reparto"].includes(status) ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-800" }

export default function AdminDashboardPage() {
  const { orders, loading: ordersLoading, error: ordersError } = useOrders()
  const activeOrders = orders.filter((order) => !["Entregado", "Cancelado"].includes(order.status)).length
  const [report, setReport] = useState<ReportSummary>(emptyReport)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState("")
  const lowStock = report.lowStock

  useEffect(() => {
    const controller = new AbortController()
    getReportSummary(controller.signal)
      .then((result) => { setReport(result.data); setError("") })
      .catch((reason) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "No fue posible cargar el resumen") })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])

  async function exportSummary() {
    setExporting(true)
    setError("")
    try { await downloadReport("summary") }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No fue posible exportar el resumen") }
    finally { setExporting(false) }
  }

  const dashboardKpis = [
    { label: "Ventas netas", value: formatCOP(report.totals.netSales), detail: "Pedidos no cancelados" },
    { label: "Compras registradas", value: formatCOP(report.totals.registeredPurchases), detail: "Facturas aprobadas" },
    { label: "Margen estimado", value: formatCOP(report.totals.estimatedMargin), detail: "Venta menos costo" },
    { label: "Pedidos activos", value: String(activeOrders), detail: "En gestión" },
  ]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Resumen general del negocio en tiempo real"
        action={
          <Button variant="outline" size="sm" disabled={exporting} onClick={() => void exportSummary()}>
            <Download className="mr-2 h-4 w-4" />
            {exporting ? "Exportando..." : "Exportar"}
          </Button>
        }
      />

      {(error || ordersError) && <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error || ordersError}</p>}
      {(loading || ordersLoading) && <p className="mb-4 text-sm text-muted-foreground">Cargando indicadores desde PostgreSQL...</p>}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {dashboardKpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
              <p className="mt-1 text-xl font-bold text-foreground">{kpi.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{kpi.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-6">
        <DashboardCharts monthly={report.monthly} categories={report.categories} loading={loading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Pedidos recientes</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/pedidos">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.slice(0, 6).map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell className="max-w-[160px] truncate">{order.customerName}</TableCell>
                      <TableCell>{formatCOP(order.total)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`${statusColor(order.status)} border-0`}>
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {ordersLoading && <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Cargando pedidos...</TableCell></TableRow>}
                  {!ordersLoading && !orders.length && <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Todavía no hay pedidos registrados.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle>Alertas de stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin alertas. Todo el inventario está por encima del mínimo.</p>
            ) : (
              lowStock.map((product) => (
                <div key={product.sku} className="flex items-center justify-between gap-2 text-sm">
                  <span className="max-w-[150px] truncate text-foreground">{product.name}</span>
                  <Badge variant="secondary" className="border-0 bg-rose-100 text-rose-800">
                    {product.stock} / min {product.stockMin}
                  </Badge>
                </div>
              ))
            )}
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/admin/inventario">Gestionar inventario</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
