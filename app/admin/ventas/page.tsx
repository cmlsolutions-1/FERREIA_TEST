import { PageHeader } from "@/components/admin/page-header"
import { NewSaleAction } from "@/components/admin/admin-actions"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ORDERS, formatCOP } from "@/lib/data"
import { Search } from "lucide-react"

const estadoColor: Record<string, string> = {
  Pendiente: "bg-amber-100 text-amber-800",
  Pagado: "bg-emerald-100 text-emerald-800",
  "En preparación": "bg-sky-100 text-sky-800",
  Enviado: "bg-indigo-100 text-indigo-800",
  Entregado: "bg-teal-100 text-teal-800",
  Cancelado: "bg-rose-100 text-rose-800",
}

export default function VentasPage() {
  const totalVendido = ORDERS.filter((o) => o.estado !== "Cancelado").reduce((a, o) => a + o.total, 0)
  const pendientes = ORDERS.filter((o) => o.estado === "Pendiente").length

  return (
    <div>
      <PageHeader
        title="Ventas y Pedidos"
        description="Gestión general de pedidos y ventas"
        action={<NewSaleAction />}
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total facturado</p>
            <p className="mt-1 text-xl font-bold">{formatCOP(totalVendido)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pedidos</p>
            <p className="mt-1 text-xl font-bold">{ORDERS.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pendientes</p>
            <p className="mt-1 text-xl font-bold text-amber-600">{pendientes}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar pedido o cliente..." className="pl-9" />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Ítems</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ORDERS.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.id}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{o.cliente}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{o.fecha}</TableCell>
                    <TableCell className="text-right">{o.items}</TableCell>
                    <TableCell className="text-right font-medium">{formatCOP(o.total)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`border-0 ${estadoColor[o.estado]}`}>
                        {o.estado}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
