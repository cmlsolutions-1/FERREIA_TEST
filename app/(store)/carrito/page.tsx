"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, Tag, Truck, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCart } from "@/components/cart-provider"
import { formatCOP } from "@/lib/data"
import { calculateTieredPrice } from "@/lib/pricing"
import { useShippingSettings } from "@/components/use-shipping-settings"
import { calculateShipping, freeShippingProgress } from "@/lib/shipping"
import { getGiftQuote, type GiftQuote } from "@/services/gifts.service"
import { getProducts, type ProductRecord } from "@/services/products.service"

function QuantityControl({ qty, stock, name, onChange }: { qty: number; stock: number; name: string; onChange: (value: number) => void }) {
  const [draft, setDraft] = useState(String(qty))
  useEffect(() => setDraft(String(qty)), [qty])
  function commit() {
    const parsed = Number(draft)
    if (!Number.isInteger(parsed) || parsed < 1) { setDraft(String(qty)); return }
    const next = Math.min(stock, parsed)
    onChange(next)
    setDraft(String(next))
  }
  return <div className="flex items-center rounded-lg border border-border">
    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={qty <= 1} onClick={() => onChange(qty - 1)} aria-label={`Restar una unidad de ${name}`}><Minus className="h-3.5 w-3.5" /></Button>
    <Input type="number" inputMode="numeric" min={1} max={stock} step={1} value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={commit} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur() }} aria-label={`Cantidad de ${name}`} className="h-8 w-16 rounded-none border-0 px-1 text-center text-sm font-medium shadow-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={qty >= stock} onClick={() => onChange(qty + 1)} aria-label={`Sumar una unidad de ${name}`}><Plus className="h-3.5 w-3.5" /></Button>
  </div>
}

export default function CartPage() {
  const { lines, subtotal, setQty, removeItem, addItem, count } = useCart()
  const [giftQuote, setGiftQuote] = useState<GiftQuote | null>(null)
  const [suggestions, setSuggestions] = useState<ProductRecord[]>([])
  const [giftError, setGiftError] = useState("")
  useEffect(() => {
    if (subtotal <= 0) return
    let stale = false
    const timer = window.setTimeout(() => {
      getGiftQuote(subtotal).then((result) => { if (!stale) { setGiftQuote(result.data); setGiftError("") } }).catch(() => { if (!stale) setGiftError("No pudimos consultar los obsequios en este momento.") })
    }, 250)
    return () => { stale = true; window.clearTimeout(timer) }
  }, [subtotal])
  useEffect(() => {
    const remaining = giftQuote?.status === "progress" ? giftQuote.remaining : null
    if (!remaining || remaining <= 0) { setSuggestions([]); return }
    let stale = false
    getProducts({ active: true, minPrice: Math.max(0, Math.floor(remaining * 0.4)), maxPrice: Math.ceil(remaining * 1.5), sort: "price-desc", limit: 20 })
      .then((result) => { if (!stale) setSuggestions(result.data.filter((item) => item.stock > 0 && !lines.some((line) => line.product.id === item.id)).slice(0, 3)) })
      .catch(() => { if (!stale) setSuggestions([]) })
    return () => { stale = true }
  }, [giftQuote, lines])
  const shippingSettings = useShippingSettings()
  const iva = Math.round(subtotal * 0.19)
  const shippingMethod = shippingSettings.standard.active ? "standard" : "express"
  const shippingQuote = calculateShipping(shippingSettings, { subtotal, quantity: count, method: shippingMethod })
  const shippingProgress = freeShippingProgress(shippingSettings, subtotal, count)
  const envio = subtotal === 0 ? 0 : shippingQuote.cost
  const total = subtotal + iva + envio

  if (count === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
          <ShoppingCart className="h-9 w-9 text-muted-foreground" />
        </span>
        <h1 className="mt-6 text-2xl font-bold text-primary">Tu carrito está vacío</h1>
        <p className="mt-2 text-muted-foreground">
          Explora nuestro catálogo y encuentra todo para tu proyecto.
        </p>
        <Button asChild className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href="/catalogo">Ir al catálogo</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-primary">Carrito de compras</h1>
      <p className="text-sm text-muted-foreground">{count} productos</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {lines.map(({ product, qty }) => {
            const pricing = calculateTieredPrice(product, qty)

            return (
              <div key={product.id} className="flex gap-4 rounded-xl border border-border bg-card p-3">
                <Link href={`/producto/${product.id}`} className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                </Link>
                <div className="flex flex-1 flex-col">
                  <p className="text-xs uppercase text-accent">{product.brand}</p>
                  <Link href={`/producto/${product.id}`} className="font-medium text-foreground hover:text-accent">
                    {product.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {pricing.breakdown.map((line) => (
                      <span key={line.key} className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                        {line.quantity} und · {line.label} a {formatCOP(line.unitPrice)}
                      </span>
                    ))}
                  </div>
                  {pricing.suggestion && (
                    <p className="mt-2 rounded-md bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
                      {pricing.suggestion}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <QuantityControl qty={qty} stock={product.stock} name={product.name} onChange={(value) => setQty(product.id, value)} />
                    <div className="text-right">
                      <span className="block font-bold text-primary">{formatCOP(pricing.total)}</span>
                      <span className="text-xs text-muted-foreground">Prom. {formatCOP(pricing.averageUnitPrice)} / und</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 self-start text-muted-foreground hover:text-destructive"
                  onClick={() => removeItem(product.id)}
                  aria-label="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-primary">Resumen del pedido</h2>
          {giftQuote?.tier && <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <p className="flex items-center gap-2 font-semibold"><Gift className="h-4 w-4" />{giftQuote.status === "earned" ? "¡Obsequio conseguido!" : "Un obsequio para tu compra"}</p>
            <div className="mt-2 flex items-center gap-2"><Image src={giftQuote.tier.product.image} alt="" width={44} height={44} className="h-11 w-11 rounded-md bg-white object-cover" /><p className="font-medium">{giftQuote.tier.product.name}<span className="block text-xs font-normal text-amber-900/80">Ref. {giftQuote.tier.product.reference}</span></p></div>
            {giftQuote.status === "progress" ? <><p className="mt-2">Agrega <strong>{formatCOP(giftQuote.remaining ?? 0)}</strong> para recibirlo gratis. Meta: {formatCOP(giftQuote.target ?? 0)} en artículos.</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-amber-200"><div className="h-full rounded-full bg-amber-600" style={{ width: `${Math.min(100, Math.max(0, subtotal / (giftQuote.target ?? 1) * 100))}%` }} /></div></> : <p className="mt-2 text-xs">Se añadirá gratis al confirmar tu pedido. Máximo uno por pedido.</p>}
            {suggestions.length > 0 && giftQuote.status === "progress" && <div className="mt-3 space-y-2 border-t border-amber-200 pt-3"><p className="font-semibold">Artículos para acercarte a la meta</p>{suggestions.map((product) => <div key={product.id} className="flex items-center gap-2 rounded-lg bg-white p-2"><Image src={product.image || "/placeholder.svg"} alt="" width={40} height={40} className="h-10 w-10 rounded object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{product.name}</p><p className="text-xs">{formatCOP(product.price)}</p></div><Button size="sm" variant="outline" onClick={() => addItem(product)} aria-label={`Agregar ${product.name} al carrito`}>Agregar</Button></div>)}</div>}
          </div>}
          {giftError && <p className="mt-2 text-xs text-muted-foreground">{giftError}</p>}
          <div className={`mt-3 rounded-lg p-3 text-sm ${shippingQuote.free ? "bg-emerald-50 text-emerald-800" : "bg-sky-50 text-sky-900"}`}><p className="flex items-center gap-2 font-semibold"><Truck className="h-4 w-4" />{!shippingQuote.available ? "Envío temporalmente no disponible" : shippingQuote.free ? `Tu envío ${shippingMethod === "standard" ? "estándar" : "express"} es gratis` : `Envío ${shippingMethod === "standard" ? "estándar" : "express"} desde ${formatCOP(envio)}`}</p>{shippingQuote.available && !shippingQuote.free && shippingQuote.method.freeShippingEligible && shippingSettings.freeShipping.enabled && <p className="mt-1 text-xs">{shippingSettings.freeShipping.mode === "all" ? "Para obtenerlo gratis debes completar las condiciones pendientes." : "Obtén envío gratis al completar una de estas condiciones."}{shippingSettings.freeShipping.byAmount && shippingProgress.amountRemaining > 0 && ` Faltan ${formatCOP(shippingProgress.amountRemaining)}.`}{shippingSettings.freeShipping.byQuantity && shippingProgress.quantityRemaining > 0 && ` Faltan ${shippingProgress.quantityRemaining} unidades.`}</p>}<p className="mt-1 text-[11px] opacity-75">El valor exacto se confirma según el departamento en el checkout.</p></div>
          <div className="mt-3 flex gap-2">
            <div className="relative flex-1">
              <Tag className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cupón de descuento" className="pl-9" />
            </div>
            <Button variant="outline" className="bg-transparent">Aplicar</Button>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium">{formatCOP(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">IVA (19%)</dt>
              <dd className="font-medium">{formatCOP(iva)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Envío</dt>
              <dd className="font-medium">{!shippingQuote.available ? "No disponible" : envio === 0 ? "Gratis" : formatCOP(envio)}</dd>
            </div>
            <div className="mt-2 flex justify-between border-t border-border pt-3 text-base">
              <dt className="font-semibold text-primary">Total</dt>
              <dd className="font-bold text-primary">{formatCOP(total)}</dd>
            </div>
          </dl>
          <Button asChild className="mt-4 w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/checkout">
              Continuar al pago <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Link href="/catalogo" className="mt-3 block text-center text-sm text-accent hover:underline">
            Seguir comprando
          </Link>
        </aside>
      </div>
    </div>
  )
}
