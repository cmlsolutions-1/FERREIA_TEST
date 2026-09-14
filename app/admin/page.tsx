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
import { KPIS, formatCOP } from "@/lib/data"
import { useOrders } from "@/components/order-provider"
import { INVENTORY_UPDATED_EVENT, type OrderStatus } from "@/lib/orders"
import { initialProductMaster, PRODUCT_STORAGE_KEY, type ProductMaster } from "@/lib/product-master"
import { ArrowUpRight, ArrowDownRight, AlertTriangle, Download } from "lucide-react"

function statusColor(status: OrderStatus) { return status === "Cancelado" ? "bg-rose-100 text-rose-800" : status === "Entregado" ? "bg-emerald-100 text-emerald-800" : ["Enviado", "En centro de distribución", "En tránsito", "En reparto"].includes(status) ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-800" }

export default function AdminDashboardPage() {
  const { orders } = useOrders()
  const [products, setProducts] = useState<ProductMaster[]>(initialProductMaster)
  const lowStock = products.filter((product) => product.stock <= product.stockMin)
  const activeOrders = orders.filter((order) => !["Entregado", "Cancelado"].includes(order.status)).length
  const dashboardKpis = [...KPIS.filter((kpi) => kpi.label !== "Pedidos pendientes"), { label: "Pedidos activos", value: String(activeOrders), delta: "En gestión", positive: activeOrders === 0 }]

  useEffect(() => {
    function loadInventory() { const stored = localStorage.getItem(PRODUCT_STORAGE_KEY); setProducts(stored ? JSON.parse(stored) as ProductMaster[] : initialProductMaster) }
    loadInventory()
    window.addEventListener(INVENTORY_UPDATED_EVENT, loadInventory)
    window.addEventListener("storage", loadInventory)
    return () => { window.removeEventListener(INVENTORY_UPDATED_EVENT, loadInventory); window.removeEventListener("storage", loadInventory) }
  }, [])

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Resumen general del negocio en tiempo real"
        action={
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {dashboardKpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
              <p className="mt-1 text-xl font-bold text-foreground">{kpi.value}</p>
              <p
                className={`mt-1 flex items-center gap-1 text-xs font-medium ${
                  kpi.positive ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {kpi.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {kpi.delta}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-6">
        <DashboardCharts />
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
