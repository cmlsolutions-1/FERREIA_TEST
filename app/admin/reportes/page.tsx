"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/admin/page-header"
import { useOrders } from "@/components/order-provider"
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
import {
  CATEGORY_SALES,
  PURCHASES,
  SALES_CHART,
  formatCOP,
} from "@/lib/data"
import { BarChart3, Download, FileSpreadsheet, TrendingUp } from "lucide-react"
import { INVENTORY_UPDATED_EVENT } from "@/lib/orders"
import { initialProductMaster, PRODUCT_STORAGE_KEY, type ProductMaster } from "@/lib/product-master"

export default function ReportesPage() {
  const { orders } = useOrders()
  const [products, setProducts] = useState<ProductMaster[]>(initialProductMaster)
  const ventas = orders.filter((order) => order.status !== "Cancelado").reduce((acc, order) => acc + order.total, 0)
  const compras = PURCHASES.reduce((acc, purchase) => acc + purchase.total, 0)
  const margenEstimado = ventas - compras * 0.28
  const bajoMinimo = products.filter((item) => item.stock <= item.stockMin)

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
        title="Reportes"
        description="Indicadores comerciales, rotación de inventario y documentos exportables"
        action={
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar resumen
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Ventas netas</p>
            <p className="mt-1 text-xl font-bold">{formatCOP(ventas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Compras registradas</p>
            <p className="mt-1 text-xl font-bold">{formatCOP(compras)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Margen estimado</p>
            <p className="mt-1 text-xl font-bold text-emerald-600">{formatCOP(margenEstimado)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Alertas de stock</p>
            <p className="mt-1 text-xl font-bold text-amber-600">{bajoMinimo.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Ventas vs compras</CardTitle>
            <Badge variant="secondary" className="border-0 bg-secondary text-secondary-foreground">
              Millones COP
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {SALES_CHART.map((row) => {
                const max = Math.max(...SALES_CHART.flatMap((item) => [item.ventas, item.compras]))
                return (
                  <div key={row.mes} className="grid grid-cols-[44px_1fr] items-center gap-3 text-sm">
                    <span className="font-medium text-muted-foreground">{row.mes}</span>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 rounded-full bg-accent" style={{ width: `${(row.ventas / max) * 100}%` }} />
                        <span className="w-8 text-xs text-muted-foreground">{row.ventas}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${(row.compras / max) * 100}%` }} />
                        <span className="w-8 text-xs text-muted-foreground">{row.compras}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categorías vendidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {CATEGORY_SALES.map((category) => (
              <div key={category.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{category.name}</span>
                  <span className="text-muted-foreground">{category.value}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${category.value}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reporte</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["Ventas detalladas", "Mensual", "Ventas y Pedidos"],
                    ["Inventario valorizado", "Actual", "Inventario"],
                    ["Compras por proveedor", "Mensual", "Compras"],
                  ].map(([name, period, source]) => (
                    <TableRow key={name}>
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell className="text-sm">{period}</TableCell>
                      <TableCell className="text-sm">{source}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="border-0 bg-emerald-100 text-emerald-800">
                          Disponible
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                          XLSX
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-accent" />
              <h2 className="font-semibold text-foreground">Lectura rápida</h2>
            </div>
            <div className="rounded-lg border border-border p-3 text-sm">
              <p className="flex items-center gap-2 font-medium text-emerald-700">
                <TrendingUp className="h-4 w-4" />
                Mes con mayor venta: Jun
              </p>
              <p className="mt-1 text-muted-foreground">
                Las herramientas eléctricas lideran la demanda y conviene reforzar reposición.
              </p>
            </div>
            {bajoMinimo.slice(0, 3).map((item) => (
              <div key={item.sku} className="flex items-center justify-between rounded-lg bg-secondary p-3 text-sm">
                <span className="max-w-[180px] truncate">{item.name}</span>
                <Badge variant="secondary" className="border-0 bg-amber-100 text-amber-800">
                  {item.stock}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
