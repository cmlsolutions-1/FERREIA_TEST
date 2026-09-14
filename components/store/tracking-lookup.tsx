"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, ShieldCheck, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCustomerSession } from "@/components/customer-session-provider"
import { useOrders } from "@/components/order-provider"
import { OrderTrackingPanel } from "@/components/store/order-tracking-panel"
import type { FerreiaOrder } from "@/lib/orders"

export function TrackingLookup({ initialOrderId = "" }: { initialOrderId?: string }) {
  const { user } = useCustomerSession()
  const { findOrder } = useOrders()
  const [orderId, setOrderId] = useState(initialOrderId)
  const [email, setEmail] = useState(user?.email ?? "")
  const [result, setResult] = useState<FerreiaOrder | null>(null)
  const [error, setError] = useState("")

  function searchOrder(event: React.FormEvent) {
    event.preventDefault()
    const order = findOrder(orderId, email, user?.id ?? null)
    if (!order) {
      setResult(null)
      setError("No encontramos un pedido que coincida con esos datos.")
      return
    }
    setError("")
    setResult(order)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent"><Truck className="h-6 w-6" /></span>
        <h1 className="mt-4 text-3xl font-black text-primary">¿Dónde está mi pedido?</h1>
        <p className="mt-2 text-muted-foreground">Consulta la ruta, la transportadora y la fecha estimada de entrega.</p>
      </div>

      <Card className="mx-auto mt-7 max-w-3xl border-primary/15 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <form onSubmit={searchOrder} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="space-y-1.5"><Label htmlFor="tracking-order">Número de pedido</Label><Input id="tracking-order" value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="Ej. FE-10233" required /></div>
            {!user && <div className="space-y-1.5"><Label htmlFor="tracking-email">Correo de la compra</Label><Input id="tracking-email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="correo@ejemplo.com" required /></div>}
            {user && <div className="rounded-lg bg-muted px-3 py-2.5 text-sm"><p className="text-xs text-muted-foreground">Consultando como</p><p className="truncate font-semibold">{user.email}</p></div>}
            <Button type="submit" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"><Search className="h-4 w-4" />Rastrear</Button>
          </form>
          {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          {!user && <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" />El correo protege la consulta de pedidos de invitados.</span><Link href="/mi-cuenta" className="font-semibold text-accent hover:underline">Ingresar a mi cuenta</Link></div>}
        </CardContent>
      </Card>

      {!result && <p className="mx-auto mt-4 max-w-3xl text-center text-xs text-muted-foreground">Pedido de demostración: FE-10233 · pedidos@eltornillo.co</p>}
      {result && <div className="mt-8"><OrderTrackingPanel order={result} /></div>}
    </div>
  )
}
