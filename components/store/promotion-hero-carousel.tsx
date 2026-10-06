"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  PackageCheck,
  ShoppingBag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCOP, type Product } from "@/lib/data"

type PromotionHeroCarouselProps = {
  products: Product[]
}

function productDiscount(product: Product) {
  const tiers = Object.values(product.priceTiers)
  return tiers.reduce((highest, tier) => {
    if (!tier.oldUnitPrice || tier.oldUnitPrice <= tier.unitPrice) return highest
    return Math.max(highest, Math.round((1 - tier.unitPrice / tier.oldUnitPrice) * 100))
  }, product.oldPrice && product.oldPrice > product.price
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0)
}

export function PromotionHeroCarousel({ products }: PromotionHeroCarouselProps) {
  const promotions = useMemo(
    () => products.filter((product) => product.promotionActive),
    [products],
  )
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (promotions.length < 2 || paused) return
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % promotions.length)
    }, 5500)
    return () => window.clearInterval(timer)
  }, [paused, promotions.length])

  useEffect(() => {
    if (activeIndex >= promotions.length) setActiveIndex(0)
  }, [activeIndex, promotions.length])

  function changeSlide(direction: -1 | 1) {
    setActiveIndex((current) => (current + direction + promotions.length) % promotions.length)
  }

  if (!promotions.length) {
    return (
      <div className="flex min-h-[430px] flex-col items-center justify-center rounded-[2rem] border border-border/80 bg-card/90 p-8 text-center shadow-[0_24px_70px_rgba(2,44,92,0.10)]">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-ice text-brand-navy">
          <BadgePercent className="h-7 w-7" />
        </span>
        <h2 className="mt-5 text-xl font-bold text-foreground">Nuevas promociones en preparación</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Cuando el administrador active una promoción, aparecerá automáticamente en este espacio.
        </p>
        <Button asChild className="mt-6 bg-brand-orange text-white hover:bg-brand-orange/90">
          <Link href="/catalogo">Explorar el catálogo</Link>
        </Button>
      </div>
    )
  }

  const product = promotions[activeIndex]
  const discount = productDiscount(product)
  const hasUnitDiscount = Boolean(product.oldPrice && product.oldPrice > product.price)

  return (
    <div
      className="relative min-h-[430px] overflow-hidden rounded-[2rem] border border-border/80 bg-card shadow-[0_24px_70px_rgba(2,44,92,0.12)]"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Promociones vigentes"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(253,98,2,0.15),transparent_30%),radial-gradient(circle_at_15%_90%,rgba(11,79,134,0.13),transparent_36%)]" />
      <div className="absolute right-5 top-5 z-20 flex items-center gap-2 rounded-full border border-white/70 bg-card/85 px-3 py-1.5 text-xs font-semibold text-brand-navy shadow-sm backdrop-blur">
        <span className="h-2 w-2 animate-pulse rounded-full bg-brand-orange" />
        Promoción vigente
      </div>

      <div className="relative grid min-h-[430px] grid-rows-[1fr_auto]" aria-live="polite">
        <div className="grid items-center gap-4 px-6 pb-2 pt-16 sm:grid-cols-[1.1fr_.9fr] sm:px-8">
          <Link
            href={`/producto/${product.id}`}
            className="group relative mx-auto flex h-52 w-full max-w-[310px] items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-brand-ice via-card to-orange-50 p-5 sm:h-72"
            aria-label={`Ver ${product.name}`}
          >
            {/* Se usa img para aceptar tanto rutas locales como imágenes remotas cargadas por el administrador. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={product.image}
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              className="h-full w-full object-contain drop-shadow-[0_18px_22px_rgba(2,44,92,0.16)] transition duration-500 group-hover:scale-105"
            />
          </Link>

          <div className="relative z-10 pb-5 sm:pb-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-orange px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                {product.badge === "Outlet" ? "Outlet" : "Oferta"}
              </span>
              {discount > 0 && (
                <span className="rounded-full bg-brand-navy px-3 py-1 text-xs font-bold text-white">
                  {hasUnitDiscount ? `-${discount}%` : `Hasta -${discount}%`}
                </span>
              )}
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-brand-orange">
              {product.brand}
            </p>
            <h2 className="mt-1 line-clamp-3 text-2xl font-black leading-tight text-brand-navy">
              {product.name}
            </h2>
            <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-1">
              <span className="text-3xl font-black tracking-tight text-foreground">
                {formatCOP(product.price)}
              </span>
              {hasUnitDiscount && (
                <span className="pb-1 text-sm text-muted-foreground line-through">
                  {formatCOP(product.oldPrice!)}
                </span>
              )}
            </div>
            {!hasUnitDiscount && discount > 0 && (
              <p className="mt-1 text-xs font-semibold text-brand-blue">Descuento disponible por volumen</p>
            )}
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <PackageCheck className="h-4 w-4 text-brand-blue" />
              {product.stock > 0 ? `${product.stock} unidades disponibles` : "Consulta disponibilidad"}
            </p>
            <Button asChild className="mt-5 h-10 rounded-full bg-brand-navy px-5 text-white hover:bg-brand-blue">
              <Link href={`/producto/${product.id}`}>
                Ver producto <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative z-20 flex items-center justify-between border-t border-border/70 bg-card/75 px-5 py-3 backdrop-blur sm:px-8">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <ShoppingBag className="h-4 w-4 text-brand-orange" />
            {activeIndex + 1} de {promotions.length} ofertas activas
          </div>
          <div className="flex items-center gap-3">
            {promotions.length > 1 && (
              <div className="hidden items-center gap-1.5 sm:flex" aria-label="Elegir promoción">
                {promotions.map((entry, index) => (
                  <button
                    key={entry.sku}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`h-2 rounded-full transition-all ${index === activeIndex ? "w-7 bg-brand-orange" : "w-2 bg-border hover:bg-brand-blue/50"}`}
                    aria-label={`Ir a la promoción ${index + 1}: ${entry.name}`}
                    aria-current={index === activeIndex ? "true" : undefined}
                  />
                ))}
              </div>
            )}
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => changeSlide(-1)}
                disabled={promotions.length < 2}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-brand-navy shadow-sm transition hover:border-brand-orange hover:text-brand-orange disabled:opacity-35"
                aria-label="Promoción anterior"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => changeSlide(1)}
                disabled={promotions.length < 2}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-orange text-white shadow-sm transition hover:bg-brand-orange/90 disabled:opacity-35"
                aria-label="Promoción siguiente"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
