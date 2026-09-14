"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, PackageCheck, Search } from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import { useOrders } from "@/components/order-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCOP } from "@/lib/data"
import type { OrderStatus } from "@/lib/orders"

export default function VentasPage() {
  const { orders } = useOrders()
  const [query, setQuery] = useState("")
  const billed = orders.filter((order) => order.status !== "Cancelado").reduce((sum, order) => sum + order.total, 0)
  const pending = orders.filter((order) => !["Entregado", "Cancelado"].includes(order.status)).length
  const visibleOrders = useMemo(() => { const clean = query.trim().toLowerCase(); return orders.filter((order) => !clean || [order.id, order.customerName, order.email, order.city].some((value) => value.toLowerCase().includes(clean))) }, [orders, query])

  return <div>
    <PageHeader title="Ventas" description="Resumen comercial conectado con las compras y el módulo de Pedidos" action={<Button asChild><Link href="/admin/pedidos"><PackageCheck className="mr-2 h-4 w-4" />Gestionar pedidos</Link></Button>} />
    <Link href="/admin/pedidos" className="mb-5 flex flex-col justify-between gap-3 rounded-xl border border-primary/15 bg-primary/[0.035] p-5 transition-colors hover:border-primary/35 sm:flex-row sm:items-center"><div><p className="font-bold text-primary">Pedidos y seguimiento de entregas</p><p className="mt-1 text-sm text-muted-foreground">Asigna transportadora, guía, ubicación y fecha estimada.</p></div><span className="flex items-center gap-2 text-sm font-semibold text-accent">Abrir módulo <ArrowRight className="h-4 w-4" /></span></Link>
    <div className="mb-4 grid grid-cols-3 gap-3"><Summary label="Total vendido" value={formatCOP(billed)} /><Summary label="Pedidos" value={String(orders.length)} /><Summary label="En gestión" value={String(pending)} warning /></div>
    <Card><CardContent className="space-y-4 p-4"><div className="relative max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar pedido o cliente..." className="pl-9" /></div><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Pedido</TableHead><TableHead>Cliente</TableHead><TableHead>Fecha</TableHead><TableHead className="text-right">Unidades</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Estado</TableHead><TableHead /></TableRow></TableHeader><TableBody>{visibleOrders.map((order) => <TableRow key={order.id}><TableCell className="font-mono font-bold">{order.id}</TableCell><TableCell><p>{order.customerName}</p><p className="text-xs text-muted-foreground">{order.guest ? "Invitado" : "Con cuenta"}</p></TableCell><TableCell>{new Date(order.createdAt).toLocaleDateString("es-CO")}</TableCell><TableCell className="text-right">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</TableCell><TableCell className="text-right font-medium">{formatCOP(order.total)}</TableCell><TableCell><Status status={order.status} /></TableCell><TableCell><Button asChild variant="ghost" size="sm"><Link href="/admin/pedidos">Gestionar</Link></Button></TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>
  </div>
}

function Summary({ label, value, warning }: { label: string; value: string; warning?: boolean }) { return <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={warning ? "mt-1 text-xl font-bold text-amber-600" : "mt-1 text-xl font-bold"}>{value}</p></CardContent></Card> }
function Status({ status }: { status: OrderStatus }) { const style = status === "Cancelado" ? "bg-rose-100 text-rose-800" : status === "Entregado" ? "bg-emerald-100 text-emerald-800" : ["Enviado", "En centro de distribución", "En tránsito", "En reparto"].includes(status) ? "bg-sky-100 text-sky-800" : "bg-amber-100 text-amber-800"; return <Badge variant="secondary" className={`border-0 ${style}`}>{status}</Badge> }
