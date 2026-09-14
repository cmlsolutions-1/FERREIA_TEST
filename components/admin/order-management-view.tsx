"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarClock, CheckCircle2, Clock3, MapPin, PackageCheck, Save, Search, Truck, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useOrders } from "@/components/order-provider"
import { formatCOP } from "@/lib/data"
import { CARRIERS, ORDER_STATUSES, type FerreiaOrder, type OrderStatus } from "@/lib/orders"

type Draft = Pick<FerreiaOrder, "carrier" | "trackingNumber" | "estimatedFrom" | "estimatedTo" | "currentLocation" | "status">

export function OrderManagementView() {
  const { orders, updateOrder } = useOrders()
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("Todos")
  const [selectedId, setSelectedId] = useState("")
  const [draft, setDraft] = useState<Draft | null>(null)
  const [eventDetail, setEventDetail] = useState("")
  const [saved, setSaved] = useState(false)
  const selected = orders.find((order) => order.id === selectedId) ?? null

  useEffect(() => {
    if (!selected) { setDraft(null); return }
    setDraft({ carrier: selected.carrier, trackingNumber: selected.trackingNumber, estimatedFrom: selected.estimatedFrom, estimatedTo: selected.estimatedTo, currentLocation: selected.currentLocation, status: selected.status })
    setEventDetail("")
    setSaved(false)
  }, [selectedId])

  const filtered = useMemo(() => {
    const clean = query.trim().toLowerCase()
    return orders.filter((order) => (statusFilter === "Todos" || order.status === statusFilter) && (!clean || [order.id, order.customerName, order.email, order.city, order.carrier, order.trackingNumber].some((value) => value.toLowerCase().includes(clean))))
  }, [orders, query, statusFilter])

  const active = orders.filter((order) => !["Entregado", "Cancelado"].includes(order.status))
  const delayed = active.filter((order) => order.estimatedTo && order.estimatedTo < new Date().toISOString().slice(0, 10)).length

  function save() {
    if (!selected || !draft) return
    updateOrder(selected.id, draft, eventDetail)
    setSaved(true)
    setEventDetail("")
  }

  return <div className="space-y-5">
    <div><h1 className="text-2xl font-bold">Pedidos</h1><p className="mt-1 text-sm text-muted-foreground">Preparación, transportadora, guía y seguimiento de las compras de clientes.</p></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric icon={PackageCheck} label="Total pedidos" value={String(orders.length)} /><Metric icon={Clock3} label="Por gestionar" value={String(active.filter((order) => ["Pedido confirmado", "Pago confirmado", "En preparación", "Listo para envío"].includes(order.status)).length)} /><Metric icon={Truck} label="En camino" value={String(active.filter((order) => ["Enviado", "En centro de distribución", "En tránsito", "En reparto"].includes(order.status)).length)} /><Metric icon={CheckCircle2} label="Entregados" value={String(orders.filter((order) => order.status === "Entregado").length)} /><Metric icon={CalendarClock} label="Con retraso" value={String(delayed)} warning={delayed > 0} /></div>

    <Card><CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_240px]"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar pedido, cliente, correo, guía o ciudad..." /></div><Select value={statusFilter} onValueChange={(value) => value && setStatusFilter(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Todos">Todos los estados</SelectItem>{ORDER_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></CardContent></Card>

    <Card className="overflow-hidden"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Pedido</TableHead><TableHead>Cliente</TableHead><TableHead>Fecha</TableHead><TableHead>Destino</TableHead><TableHead>Transportadora</TableHead><TableHead>Entrega estimada</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader><TableBody>{filtered.map((order) => <TableRow key={order.id} onClick={() => setSelectedId(order.id)} className="cursor-pointer"><TableCell className="font-mono font-bold">{order.id}</TableCell><TableCell><p className="font-medium">{order.customerName}</p><p className="text-xs text-muted-foreground">{order.guest ? "Invitado" : "Con cuenta"} · {order.email}</p></TableCell><TableCell>{new Date(order.createdAt).toLocaleDateString("es-CO")}</TableCell><TableCell>{order.city}<p className="text-xs text-muted-foreground">{order.department}</p></TableCell><TableCell>{order.carrier}<p className="font-mono text-xs text-muted-foreground">{order.trackingNumber || "Guía pendiente"}</p></TableCell><TableCell>{order.estimatedTo || "Por confirmar"}</TableCell><TableCell className="text-right font-semibold">{formatCOP(order.total)}</TableCell><TableCell><StatusBadge status={order.status} /></TableCell></TableRow>)}{!filtered.length && <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">No hay pedidos para los filtros seleccionados.</TableCell></TableRow>}</TableBody></Table></div></Card>

    {selected && draft && <Card className="border-primary/20"><div className="flex flex-col justify-between gap-3 border-b px-5 py-4 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><h2 className="text-lg font-bold">Gestionar {selected.id}</h2><Badge variant="outline">{selected.guest ? "Invitado" : "Cliente registrado"}</Badge></div><p className="text-sm text-muted-foreground">{selected.customerName} · {selected.phone} · {selected.email}</p></div><Button onClick={save}><Save className="mr-2 h-4 w-4" />{saved ? "Actualizado" : "Guardar y notificar"}</Button></div><CardContent className="grid gap-6 p-5 lg:grid-cols-[1fr_360px]"><div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="Estado"><Select value={draft.status} onValueChange={(value) => value && setDraft({ ...draft, status: value as OrderStatus })} disabled={selected.status === "Cancelado"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ORDER_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></Field><Field label="Transportadora"><Select value={draft.carrier} onValueChange={(value) => value && setDraft({ ...draft, carrier: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CARRIERS.map((carrier) => <SelectItem key={carrier} value={carrier}>{carrier}</SelectItem>)}</SelectContent></Select></Field><Field label="Número de guía"><Input value={draft.trackingNumber} onChange={(event) => setDraft({ ...draft, trackingNumber: event.target.value })} placeholder="Pendiente" /></Field><Field label="Entrega desde"><Input type="date" value={draft.estimatedFrom} onChange={(event) => setDraft({ ...draft, estimatedFrom: event.target.value })} /></Field><Field label="Entrega hasta"><Input type="date" value={draft.estimatedTo} onChange={(event) => setDraft({ ...draft, estimatedTo: event.target.value })} /></Field><Field label="Ubicación actual"><Input value={draft.currentLocation} onChange={(event) => setDraft({ ...draft, currentLocation: event.target.value })} placeholder="Centro de distribución..." /></Field></div><Field label="Actualización visible para el cliente"><Textarea value={eventDetail} onChange={(event) => setEventDetail(event.target.value)} placeholder="Ej. El paquete salió del centro logístico y viaja hacia Cali." /></Field><div className="rounded-xl bg-muted/40 p-4"><p className="flex items-center gap-2 font-semibold"><MapPin className="h-4 w-4 text-accent" />Dirección de entrega</p><p className="mt-1 text-sm text-muted-foreground">{selected.address}, {selected.city}, {selected.department}</p></div><div><div className="mb-2 flex flex-wrap items-center gap-2"><p className="font-semibold">Productos del pedido</p>{selected.inventoryApplied && !selected.inventoryRestored && <Badge className="bg-emerald-100 text-emerald-800">Inventario descontado</Badge>}</div><div className="space-y-2">{selected.items.map((item) => <div key={item.sku} className="flex justify-between rounded-lg border p-3 text-sm"><span>{item.name}</span><b>{item.quantity} und.</b></div>)}</div>{selected.inventoryRestored && <p className="mt-2 text-xs font-semibold text-emerald-700">El inventario de este pedido fue devuelto por cancelación.</p>}</div></div><div><h3 className="font-semibold">Historial visible</h3><div className="mt-3 space-y-3">{[...selected.timeline].reverse().map((event) => <div key={event.id} className="rounded-lg border p-3"><div className="flex justify-between gap-2"><p className="text-sm font-semibold">{event.title}</p><time className="text-[11px] text-muted-foreground">{new Date(event.occurredAt).toLocaleString("es-CO")}</time></div><p className="mt-1 text-xs text-muted-foreground">{event.detail}</p><p className="mt-1 text-xs font-medium text-primary">{event.location}</p></div>)}</div></div></CardContent></Card>}
  </div>
}

function Metric({ icon: Icon, label, value, warning }: { icon: typeof Users; label: string; value: string; warning?: boolean }) { return <Card><CardContent className="flex items-start justify-between p-4"><div><p className="text-xs text-muted-foreground">{label}</p><p className={warning ? "mt-1 text-xl font-bold text-rose-600" : "mt-1 text-xl font-bold"}>{value}</p></div><span className="rounded-xl bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" /></span></CardContent></Card> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}</div> }
function StatusBadge({ status }: { status: OrderStatus }) { const style = status === "Cancelado" ? "bg-rose-50 text-rose-700" : status === "Entregado" ? "bg-emerald-50 text-emerald-700" : ["Enviado", "En centro de distribución", "En tránsito", "En reparto"].includes(status) ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-700"; return <Badge variant="secondary" className={style}>{status}</Badge> }
