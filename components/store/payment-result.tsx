"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AlertCircle, CheckCircle2, Clock3, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/components/cart-provider"
import type { MercadoPagoSyncResult } from "@/lib/mercado-pago"
import { createMercadoPagoCheckout, synchronizeMercadoPagoPayment } from "@/services/payments.service"

type StoredOrder = { orderId: string; email: string }

function storedOrder() {
  try {
    const value = window.sessionStorage.getItem("ferreia-mercadopago-order")
    return value ? JSON.parse(value) as StoredOrder : null
  } catch { return null }
}

export function PaymentResult({ requestedResult, paymentId, orderId }: { requestedResult: string; paymentId: string; orderId: string }) {
  const { clear } = useCart()
  const clearCart = useRef(clear)
  const [payment, setPayment] = useState<MercadoPagoSyncResult | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(Boolean(paymentId))
  const [retrying, setRetrying] = useState(false)
  const [localOrderId, setLocalOrderId] = useState("")

  useEffect(() => { clearCart.current = clear }, [clear])

  useEffect(() => {
    setLocalOrderId(storedOrder()?.orderId ?? "")
    if (!paymentId) return
    let active = true
    synchronizeMercadoPagoPayment(paymentId)
      .then((response) => {
        if (!active) return
        setPayment(response.data)
        if (response.data.status === "approved") {
          clearCart.current()
          window.sessionStorage.removeItem("ferreia-mercadopago-order")
        }
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "No fue posible confirmar el pago.") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [paymentId])

  // El parámetro de retorno no acredita un pago; solo la consulta al servidor puede hacerlo.
  const status = payment?.status ?? (requestedResult === "failure" ? "rejected" : "pending")
  const resolvedOrderId = payment?.orderId || orderId || localOrderId
  const approved = status === "approved"
  const rejected = ["rejected", "cancelled"].includes(status)

  async function retry() {
    const stored = storedOrder()
    if (!stored?.orderId || !stored.email) {
      setError("No encontramos los datos locales del pedido. Puedes consultarlo y solicitar un nuevo enlace de pago.")
      return
    }
    setRetrying(true)
    setError("")
    try {
      const checkout = await createMercadoPagoCheckout(stored.orderId, stored.email)
      window.location.assign(checkout.data.checkoutUrl)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible reintentar el pago.")
      setRetrying(false)
    }
  }

  if (loading) return <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center"><Loader2 className="h-12 w-12 animate-spin text-sky-600" /><h1 className="mt-5 text-2xl font-bold text-primary">Confirmando el pago</h1><p className="mt-2 text-muted-foreground">Estamos consultando directamente a Mercado Pago. No cierres esta ventana.</p></main>

  return <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center">
    <span className={`flex h-20 w-20 items-center justify-center rounded-full ${approved ? "bg-emerald-50" : rejected ? "bg-rose-50" : "bg-amber-50"}`}>
      {approved ? <CheckCircle2 className="h-12 w-12 text-emerald-600" /> : rejected ? <AlertCircle className="h-12 w-12 text-rose-600" /> : <Clock3 className="h-12 w-12 text-amber-600" />}
    </span>
    <p className="mt-5 text-sm font-bold uppercase tracking-widest text-accent">Mercado Pago</p>
    <h1 className="mt-1 text-3xl font-black text-primary">{approved ? "¡Pago confirmado!" : rejected ? "El pago no fue aprobado" : "Pago pendiente de confirmación"}</h1>
    <p className="mt-3 max-w-xl text-muted-foreground">
      {approved ? "Mercado Pago acreditó la operación y el pedido ya quedó marcado como pagado." : rejected ? "No se realizó el cobro. Puedes intentar nuevamente con otro medio de pago sin duplicar el pedido." : "El medio de pago todavía está procesando la operación. Actualizaremos el pedido automáticamente cuando Mercado Pago informe el resultado."}
    </p>
    {resolvedOrderId && <p className="mt-4 rounded-lg bg-muted px-4 py-2 text-sm">Pedido <b>{resolvedOrderId}</b>{paymentId ? <> · Pago <b>{paymentId}</b></> : null}</p>}
    {error && <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    <div className="mt-7 flex flex-wrap justify-center gap-3">
      {rejected && <Button onClick={() => void retry()} disabled={retrying} className="bg-sky-600 text-white hover:bg-sky-700"><RefreshCw className={`mr-2 h-4 w-4 ${retrying ? "animate-spin" : ""}`} />{retrying ? "Abriendo..." : "Reintentar pago"}</Button>}
      {resolvedOrderId && <Button asChild variant="outline"><Link href={`/rastrear-pedido?pedido=${encodeURIComponent(resolvedOrderId)}`}>Consultar pedido</Link></Button>}
      <Button asChild variant="ghost"><Link href="/catalogo">Volver al catálogo</Link></Button>
    </div>
  </main>
}
