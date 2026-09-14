"use client"

import Link from "next/link"
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCart } from "@/components/cart-provider"
import { formatCOP } from "@/lib/data"
import { calculateTieredPrice } from "@/lib/pricing"

export default function CartPage() {
  const { lines, subtotal, setQty, removeItem, count } = useCart()
  const iva = Math.round(subtotal * 0.19)
  const envio = subtotal >= 150000 || subtotal === 0 ? 0 : 12000
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
                    <div className="flex items-center rounded-lg border border-border">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQty(product.id, qty - 1)} aria-label="Restar">
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-9 text-center text-sm font-medium">{qty}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQty(product.id, qty + 1)} aria-label="Sumar">
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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
              <dd className="font-medium">{envio === 0 ? "Gratis" : formatCOP(envio)}</dd>
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
