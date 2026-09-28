"use client"

import { useEffect, useState } from "react"
import { CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Eye, FileText, Loader2, MailCheck, MailWarning, MapPin, PackageCheck, Save, Search, Truck, Users } from "lucide-react"
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
import { getOrders } from "@/services/orders.service"

type Draft = Pick<FerreiaOrder, "carrier" | "trackingNumber" | "estimatedFrom" | "estimatedTo" | "currentLocation" | "status">

export function OrderManagementView() {
  const { orders: allOrders, updateOrder } = useOrders()
  const [orders, setOrders] = useState<FerreiaOrder[]>([])
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("Todos")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [selectedId, setSelectedId] = useState("")
  const [draft, setDraft] = useState<Draft | null>(null)
  const [eventDetail, setEventDetail] = useState("")
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState<FerreiaOrder["notification"]>()
  const [showOrderDocument, setShowOrderDocument] = useState(false)
  const selected = orders.find((order) => order.id === selectedId) ?? null

  useEffect(() => { const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300); return () => window.clearTimeout(timer) }, [query])
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setLoadError("")
    getOrders({ page, limit: 20, search: debouncedQuery || undefined, status: statusFilter === "Todos" ? undefined : statusFilter }, controller.signal)
      .then((result) => { setOrders(result.data); setTotal(result.meta?.total ?? result.data.length); setTotalPages(result.meta?.totalPages ?? (result.data.length ? 1 : 0)); setSelectedId((current) => result.data.some((order) => order.id === current) ? current : "") })
      .catch((error) => { if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "No fue posible cargar los pedidos") })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [page, debouncedQuery, statusFilter])
  useEffect(() => { if (!selected) { setDraft(null); return }; setDraft({ carrier: selected.carrier, trackingNumber: selected.trackingNumber, estimatedFrom: selected.estimatedFrom, estimatedTo: selected.estimatedTo, currentLocation: selected.currentLocation, status: selected.status }) }, [selected])
  useEffect(() => { setEventDetail(""); setNotification(undefined); setShowOrderDocument(false) }, [selectedId])

  const active = allOrders.filter((order) => !["Entregado", "Cancelado"].includes(order.status))
  const delayed = active.filter((order) => order.estimatedTo && order.estimatedTo < new Date().toISOString().slice(0, 10)).length

  async function save() {
    if (!selected || !draft || saving) return
    setLoadError(""); setNotification(undefined); setSaving(true)
    try {
      const updated = await updateOrder(selected.id, draft, eventDetail)
      setOrders((current) => current.map((order) => order.id === updated.id ? updated : order))
      setNotification(updated.notification ?? { sent: false, message: "Pedido actualizado sin confirmación del correo" })
      setEventDetail("")
    } catch (error) { setLoadError(error instanceof Error ? error.message : "No fue posible actualizar el pedido") } finally { setSaving(false) }
  }

  return <div className="space-y-5">
    <div><h1 className="text-2xl font-bold">Pedidos</h1><p className="mt-1 text-sm text-muted-foreground">Preparación, transportadora, guía y seguimiento de las compras de clientes.</p></div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric icon={PackageCheck} label="Total pedidos" value={String(allOrders.length)} /><Metric icon={Clock3} label="Por gestionar" value={String(active.filter((order) => ["Pedido confirmado", "Pago confirmado", "En preparación", "Listo para envío"].includes(order.status)).length)} /><Metric icon={Truck} label="En camino" value={String(active.filter((order) => ["Enviado", "En centro de distribución", "En tránsito", "En reparto"].includes(order.status)).length)} /><Metric icon={CheckCircle2} label="Entregados" value={String(allOrders.filter((order) => order.status === "Entregado").length)} /><Metric icon={CalendarClock} label="Con retraso" value={String(delayed)} warning={delayed > 0} /></div>
    <Card><CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_240px]"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder="Buscar pedido, cliente, correo, guía o ciudad..." /></div><Select value={statusFilter} onValueChange={(value) => { if (value) { setStatusFilter(value); setPage(1) } }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Todos">Todos los estados</SelectItem>{ORDER_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></CardContent></Card>
    {loadError && <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{loadError}</p>}
    <Card className="overflow-hidden"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Pedido</TableHead><TableHead>Cliente</TableHead><TableHead>Fecha</TableHead><TableHead>Destino</TableHead><TableHead>Transportadora</TableHead><TableHead>Entrega estimada</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">Cargando pedidos...</TableCell></TableRow> : orders.map((order) => <TableRow key={order.id} onClick={() => setSelectedId(order.id)} className="cursor-pointer"><TableCell className="font-mono font-bold">{order.id}</TableCell><TableCell><p className="font-medium">{order.customerName}</p><p className="text-xs text-muted-foreground">{order.guest ? "Invitado" : "Con cuenta"} · {order.email}</p></TableCell><TableCell>{new Date(order.createdAt).toLocaleDateString("es-CO")}</TableCell><TableCell>{order.city}<p className="text-xs text-muted-foreground">{order.department}</p></TableCell><TableCell>{order.carrier}<p className="font-mono text-xs text-muted-foreground">{order.trackingNumber || "Guía pendiente"}</p></TableCell><TableCell>{order.estimatedTo || "Por confirmar"}</TableCell><TableCell className="text-right font-semibold">{formatCOP(order.total)}</TableCell><TableCell><StatusBadge status={order.status} /></TableCell></TableRow>)}{!loading && !orders.length && <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">No hay pedidos para los filtros seleccionados.</TableCell></TableRow>}</TableBody></Table></div>{!loading && totalPages > 0 && <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>{total} {total === 1 ? "pedido" : "pedidos"} · Página {page} de {totalPages}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft className="mr-1 h-4 w-4" />Anterior</Button><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Siguiente<ChevronRight className="ml-1 h-4 w-4" /></Button></div></div>}</Card>
    {selected && draft && <Card className="border-primary/20">
      <div className="flex flex-col justify-between gap-3 border-b px-5 py-4 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><h2 className="text-lg font-bold">Gestionar {selected.id}</h2><Badge variant="outline">{selected.guest ? "Invitado" : "Cliente registrado"}</Badge></div><p className="text-sm text-muted-foreground">{selected.customerName} · {selected.phone} · {selected.email}</p></div><Button onClick={save} disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}{saving ? "Guardando y enviando..." : "Guardar y notificar"}</Button></div>
      <CardContent className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_360px]"><div className="min-w-0 space-y-5">
        {notification && <div role="status" className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${notification.sent ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>{notification.sent ? <MailCheck className="mt-0.5 h-5 w-5 shrink-0" /> : <MailWarning className="mt-0.5 h-5 w-5 shrink-0" />}<div><p className="font-semibold">{notification.sent ? "Pedido actualizado y cliente notificado" : "Pedido actualizado; correo pendiente"}</p><p>{notification.message}</p></div></div>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="Estado"><Select value={draft.status} onValueChange={(value) => value && setDraft({ ...draft, status: value as OrderStatus })} disabled={selected.status === "Cancelado"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ORDER_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></Field><Field label="Transportadora"><Select value={draft.carrier} onValueChange={(value) => value && setDraft({ ...draft, carrier: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CARRIERS.map((carrier) => <SelectItem key={carrier} value={carrier}>{carrier}</SelectItem>)}</SelectContent></Select></Field><Field label="Número de guía"><Input value={draft.trackingNumber} onChange={(event) => setDraft({ ...draft, trackingNumber: event.target.value })} placeholder="Pendiente" /></Field><Field label="Entrega desde"><Input type="date" value={draft.estimatedFrom} onChange={(event) => setDraft({ ...draft, estimatedFrom: event.target.value })} /></Field><Field label="Entrega hasta"><Input type="date" value={draft.estimatedTo} onChange={(event) => setDraft({ ...draft, estimatedTo: event.target.value })} /></Field><Field label="Ubicación actual"><Input value={draft.currentLocation} onChange={(event) => setDraft({ ...draft, currentLocation: event.target.value })} placeholder="Centro de distribución..." /></Field></div>
        <Field label="Actualización visible para el cliente"><Textarea value={eventDetail} onChange={(event) => setEventDetail(event.target.value)} placeholder="Ej. El paquete salió del centro logístico y viaja hacia Cali." /></Field>
        <div className="rounded-xl bg-muted/40 p-4"><p className="flex items-center gap-2 font-semibold"><MapPin className="h-4 w-4 text-accent" />Dirección de entrega</p><p className="mt-1 text-sm text-muted-foreground">{selected.address}, {selected.city}, {selected.department}</p></div>
        <OrderProducts order={selected} onShowDocument={() => setShowOrderDocument((current) => !current)} showingDocument={showOrderDocument} />
        {showOrderDocument && <CustomerOrderDocument order={selected} />}
      </div><div><h3 className="font-semibold">Historial visible</h3><div className="mt-3 space-y-3">{[...selected.timeline].reverse().map((event) => <div key={event.id} className="rounded-lg border p-3"><div className="flex justify-between gap-2"><p className="text-sm font-semibold">{event.title}</p><time className="text-[11px] text-muted-foreground">{new Date(event.occurredAt).toLocaleString("es-CO")}</time></div><p className="mt-1 text-xs text-muted-foreground">{event.detail}</p><p className="mt-1 text-xs font-medium text-primary">{event.location}</p></div>)}</div></div></CardContent>
    </Card>}
  </div>
}

function OrderProducts({ order, onShowDocument, showingDocument }: { order: FerreiaOrder; onShowDocument: () => void; showingDocument: boolean }) {
  return <section className="overflow-hidden rounded-xl border"><div className="flex flex-col justify-between gap-3 border-b bg-slate-50 px-4 py-3 sm:flex-row sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">Productos del pedido</p><Badge variant="outline">{order.items.length} referencias</Badge>{order.inventoryApplied && !order.inventoryRestored && <Badge className="bg-emerald-100 text-emerald-800">Inventario descontado</Badge>}</div><p className="mt-1 text-xs text-muted-foreground">Detalle operativo de las líneas solicitadas por el cliente.</p></div><Button type="button" size="sm" variant="outline" onClick={onShowDocument}>{showingDocument ? <FileText className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}{showingDocument ? "Ocultar orden" : "Ver orden del cliente"}</Button></div><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead className="w-14">Línea</TableHead><TableHead>Referencia</TableHead><TableHead>Artículo</TableHead><TableHead className="text-right">Cantidad</TableHead><TableHead className="text-right">Precio unitario</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader><TableBody>{order.items.map((item, index) => <TableRow key={`${item.sku}-${index}`}><TableCell className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</TableCell><TableCell><p className="font-mono font-semibold text-primary">{item.reference || item.sku}</p><p className="text-[11px] text-muted-foreground">SKU {item.sku}</p></TableCell><TableCell className="min-w-56 font-medium">{item.name}</TableCell><TableCell className="text-right font-semibold">{item.quantity} und.</TableCell><TableCell className="text-right">{formatCOP(item.unitPrice)}</TableCell><TableCell className="text-right font-semibold">{formatCOP(item.total)}</TableCell></TableRow>)}</TableBody></Table></div>{order.inventoryRestored && <p className="border-t bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">El inventario de este pedido fue devuelto por cancelación.</p>}</section>
}

function CustomerOrderDocument({ order }: { order: FerreiaOrder }) {
  return <section className="rounded-xl border-2 border-slate-300 bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 border-b-2 border-primary pb-4 sm:flex-row"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">FERREIA · Orden del cliente</p><h3 className="mt-1 font-mono text-2xl font-black text-primary">{order.id}</h3></div><div className="sm:text-right"><StatusBadge status={order.status} /><p className="mt-2 text-xs text-muted-foreground">Creada el {new Date(order.createdAt).toLocaleString("es-CO")}</p></div></div><div className="grid gap-4 border-b py-4 text-sm sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase text-muted-foreground">Cliente</p><p className="mt-1 font-semibold">{order.customerName}</p><p>{order.document}</p><p>{order.email} · {order.phone}</p></div><div><p className="text-xs font-semibold uppercase text-muted-foreground">Entrega y pago</p><p className="mt-1">{order.address}, {order.city}, {order.department}</p><p>{order.shippingMethod} · {order.paymentMethod}</p><p>{order.paymentStatus}</p></div></div><div className="overflow-x-auto py-4"><Table><TableHeader><TableRow><TableHead>Referencia / SKU</TableHead><TableHead>Descripción</TableHead><TableHead className="text-right">Cant.</TableHead><TableHead className="text-right">Unitario</TableHead><TableHead className="text-right">Importe</TableHead></TableRow></TableHeader><TableBody>{order.items.map((item, index) => <TableRow key={`${item.sku}-document-${index}`}><TableCell className="font-mono"><b>{item.reference || item.sku}</b><br /><span className="text-xs text-muted-foreground">{item.sku}</span></TableCell><TableCell>{item.name}</TableCell><TableCell className="text-right">{item.quantity}</TableCell><TableCell className="text-right">{formatCOP(item.unitPrice)}</TableCell><TableCell className="text-right font-semibold">{formatCOP(item.total)}</TableCell></TableRow>)}</TableBody></Table></div><div className="ml-auto grid max-w-xs grid-cols-2 gap-x-8 gap-y-1 border-t pt-4 text-sm"><span>Subtotal</span><span className="text-right">{formatCOP(order.subtotal)}</span><span>Impuestos</span><span className="text-right">{formatCOP(order.tax)}</span><span>Flete</span><span className="text-right">{formatCOP(order.shippingCost)}</span><strong className="mt-1 text-base">Total pedido</strong><strong className="mt-1 text-right text-base">{formatCOP(order.total)}</strong></div></section>
}

function Metric({ icon: Icon, label, value, warning }: { icon: typeof Users; label: string; value: string; warning?: boolean }) { return <Card><CardContent className="flex items-start justify-between p-4"><div><p className="text-xs text-muted-foreground">{label}</p><p className={warning ? "mt-1 text-xl font-bold text-rose-600" : "mt-1 text-xl font-bold"}>{value}</p></div><span className="rounded-xl bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" /></span></CardContent></Card> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}</div> }
function StatusBadge({ status }: { status: OrderStatus }) { const style = status === "Cancelado" ? "bg-rose-50 text-rose-700" : status === "Entregado" ? "bg-emerald-50 text-emerald-700" : ["Enviado", "En centro de distribución", "En tránsito", "En reparto"].includes(status) ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-700"; return <Badge variant="secondary" className={style}>{status}</Badge> }
