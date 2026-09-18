"use client"

import Link from "next/link"
import { Star, ShoppingCart, Check } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/components/cart-provider"
import { formatCOP, type Product } from "@/lib/data"
import { cn } from "@/lib/utils"
import { useLiveProduct } from "@/components/use-live-stock"

export function RatingStars({ rating, className }: { rating: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`Calificación ${rating} de 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40",
          )}
        />
      ))}
    </div>
  )
}

export function ProductCard({ product: initialProduct }: { product: Product }) {
  const product = useLiveProduct(initialProduct)
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)
  const stock = product.stock

  function handleAdd() {
    if (stock <= 0) return
    addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg">
      <Link href={`/producto/${product.id}`} className="relative block">
        <div className="relative aspect-square overflow-hidden bg-secondary">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {product.badge && (
              <Badge
                className={cn(
                  "border-0 text-xs",
                  product.badge === "Oferta" && "bg-destructive text-white",
                  product.badge === "Más vendido" && "bg-accent text-accent-foreground",
                  product.badge === "Nuevo" && "bg-primary text-primary-foreground",
                )}
              >
                {product.badge}
              </Badge>
            )}
            {discount > 0 && (
              <Badge className="border-0 bg-destructive text-white text-xs">-{discount}%</Badge>
            )}
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-accent">{product.brand}</p>
        <Link
          href={`/producto/${product.id}`}
          className="mt-0.5 line-clamp-2 text-sm font-medium text-foreground hover:text-accent"
        >
          {product.name}
        </Link>
        <div className="mt-1 flex items-center gap-1.5">
          <RatingStars rating={product.rating} />
          <span className="text-xs text-muted-foreground">({product.reviews})</span>
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary">{formatCOP(product.price)}</span>
          {product.oldPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatCOP(product.oldPrice)}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs font-medium text-accent">
          Master x{product.priceTiers.master.quantity}: {formatCOP(product.priceTiers.master.unitPrice)} / und
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {stock > 0 ? (
            <span className="text-accent">En stock · {stock} unidades</span>
          ) : (
            <span className="text-destructive">Agotado</span>
          )}
        </p>

        <Button
          onClick={handleAdd}
          disabled={stock <= 0}
          className={cn(
            "mt-3 w-full gap-2",
            added
              ? "bg-accent text-accent-foreground hover:bg-accent/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
          size="sm"
        >
          {stock <= 0 ? "Agotado" : added ? (
            <>
              <Check className="h-4 w-4" /> Agregado
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" /> Agregar
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
