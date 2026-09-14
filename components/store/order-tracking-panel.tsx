"use client"

import { CalendarDays, Check, Circle, Clock3, MapPin, PackageCheck, Truck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatCOP } from "@/lib/data"
import { orderProgress, type FerreiaOrder } from "@/lib/orders"

function formatDate(value: string) {
  if (!value) return "Por confirmar"
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(new Date(`${value}T12:00:00`))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

export function OrderTrackingPanel({ order }: { order: FerreiaOrder }) {
  const progress = orderProgress(order.status)
  const cancelled = order.status === "Cancelado"

  return (
    <div className="space-y-5">
      <Card className={cancelled ? "border-rose-200" : "overflow-hidden border-primary/15"}>
        <div className={cancelled ? "bg-rose-50 px-5 py-5" : "bg-gradient-to-r from-primary to-[#24596b] px-5 py-5 text-primary-foreground"}>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className={cancelled ? "text-xs font-bold uppercase tracking-wider text-rose-600" : "text-xs font-bold uppercase tracking-wider text-primary-foreground/65"}>Pedido {order.id}</p>
              <h2 className="mt-1 text-2xl font-black">{order.status}</h2>
              <p className={cancelled ? "mt-1 text-sm text-rose-700" : "mt-1 text-sm text-primary-foreground/75"}>{order.currentLocation}</p>
            </div>
            <Badge className={cancelled ? "w-fit bg-rose-600 text-white" : "w-fit bg-white/15 text-white"}>{order.guest ? "Compra como invitado" : "Compra con cuenta"}</Badge>
          </div>
          {!cancelled && <div className="mt-5"><div className="h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} /></div><div className="mt-2 flex justify-between text-xs text-primary-foreground/70"><span>Confirmado</span><span>{progress}%</span><span>Entregado</span></div></div>}
        </div>
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
          <Info icon={CalendarDays} label="Entrega estimada" value={order.estimatedFrom === order.estimatedTo ? formatDate(order.estimatedTo) : `${formatDate(order.estimatedFrom)} – ${formatDate(order.estimatedTo)}`} />
          <Info icon={Truck} label="Transportadora" value={order.carrier || "Por asignar"} detail={order.trackingNumber || "Guía pendiente"} />
          <Info icon={MapPin} label="Destino" value={`${order.city}, ${order.department}`} detail={order.address} />
          <Info icon={PackageCheck} label="Total del pedido" value={formatCOP(order.total)} detail={`${order.items.reduce((sum, item) => sum + item.quantity, 0)} unidades`} />
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardContent className="p-5">
            <div className="mb-5 flex items-center gap-2"><Clock3 className="h-5 w-5 text-accent" /><div><h3 className="font-bold">Historial del envío</h3><p className="text-xs text-muted-foreground">Actualizaciones registradas por FERREIA</p></div></div>
            <div className="space-y-0">
              {[...order.timeline].reverse().map((item, index, list) => (
                <div key={item.id} className="grid grid-cols-[28px_1fr] gap-3">
                  <div className="flex flex-col items-center">
                    <span className={index === 0 ? "flex h-7 w-7 items-center justify-center rounded-full bg-accent text-accent-foreground" : "flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground"}>{index === 0 ? <Check className="h-4 w-4" /> : <Circle className="h-3 w-3" />}</span>
                    {index < list.length - 1 && <span className="min-h-14 w-px flex-1 bg-border" />}
                  </div>
                  <div className="pb-6">
                    <div className="flex flex-wrap items-start justify-between gap-2"><p className="font-semibold">{item.title}</p><time className="text-xs text-muted-foreground">{formatDateTime(item.occurredAt)}</time></div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-primary"><MapPin className="h-3 w-3" />{item.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardContent className="p-5">
            <h3 className="font-bold">Productos</h3>
            <div className="mt-4 space-y-4">
              {order.items.map((item) => <div key={`${item.sku}-${item.productId}`} className="flex gap-3"><img src={item.image || "/placeholder.svg"} alt={item.name} className="h-14 w-14 rounded-lg border object-cover" /><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-medium">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">{item.quantity} und · {formatCOP(item.total)}</p></div></div>)}
            </div>
            <dl className="mt-5 space-y-2 border-t pt-4 text-sm"><div className="flex justify-between"><dt className="text-muted-foreground">Pago</dt><dd className="font-medium">{order.paymentStatus}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Método</dt><dd>{order.paymentMethod}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Envío</dt><dd>{order.shippingMethod}</dd></div></dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Info({ icon: Icon, label, value, detail }: { icon: typeof Truck; label: string; value: string; detail?: string }) {
  return <div className="flex items-start gap-3"><span className="rounded-xl bg-accent/10 p-2 text-accent"><Icon className="h-5 w-5" /></span><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 text-sm font-bold">{value}</p>{detail && <p className="mt-0.5 truncate text-xs text-muted-foreground">{detail}</p>}</div></div>
}
