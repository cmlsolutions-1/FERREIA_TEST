"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronRight,
  Minus,
  Plus,
  ShoppingCart,
  Zap,
  Truck,
  ShieldCheck,
  Barcode,
  PlayCircle,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductCard, RatingStars } from "@/components/store/product-card"
import { useCart } from "@/components/cart-provider"
import { formatCOP, relatedProducts, type Product } from "@/lib/data"
import { calculateTieredPrice } from "@/lib/pricing"
import { cn } from "@/lib/utils"
import { useLiveProduct } from "@/components/use-live-stock"

export function ProductDetail({ product: initialProduct }: { product: Product }) {
  const product = useLiveProduct(initialProduct)
  const router = useRouter()
  const { addItem } = useCart()
  const [qty, setQty] = useState(1)
  const [activeImg, setActiveImg] = useState(0)
  const [added, setAdded] = useState(false)
  const stock = product.stock
  const pricing = calculateTieredPrice(product, qty)

  const gallery = [
    product.image,
    `/placeholder.svg?height=600&width=600&query=${encodeURIComponent(product.name + " angle 2")}`,
    `/placeholder.svg?height=600&width=600&query=${encodeURIComponent(product.name + " detail")}`,
    `/placeholder.svg?height=600&width=600&query=${encodeURIComponent(product.name + " packaging")}`,
  ]
  const related = relatedProducts(product)

  function handleAdd() {
    if (stock <= 0 || qty > stock) return
    addItem(product, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }
  function buyNow() {
    if (stock <= 0 || qty > stock) return
    addItem(product, qty)
    router.push("/checkout")
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-accent">Inicio</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/catalogo" className="hover:text-accent">Catálogo</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-secondary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gallery[activeImg] || "/placeholder.svg"}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-150"
            />
            <span className="absolute right-3 top-3 rounded-full bg-background/90 px-2 py-1 text-xs text-muted-foreground">
              Pasa el cursor para zoom
            </span>
          </div>
          <div className="mt-3 flex gap-3">
            {gallery.map((g, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={cn(
                  "h-20 w-20 overflow-hidden rounded-lg border-2",
                  activeImg === i ? "border-accent" : "border-border",
                )}
                aria-label={`Imagen ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          <button className="mt-3 flex items-center gap-2 text-sm font-medium text-accent hover:underline">
            <PlayCircle className="h-5 w-5" /> Ver video demostrativo
          </button>
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium uppercase tracking-wide text-accent">{product.brand}</p>
            {product.badge && (
              <Badge className="border-0 bg-accent/15 text-accent">{product.badge}</Badge>
            )}
          </div>
          <h1 className="mt-1 text-3xl font-bold text-primary text-balance">{product.name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <RatingStars rating={product.rating} />
            <span className="text-sm text-muted-foreground">
              {product.rating} · {product.reviews} reseñas
            </span>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">{formatCOP(product.price)}</span>
            {product.oldPrice && (
              <span className="text-lg text-muted-foreground line-through">
                {formatCOP(product.oldPrice)}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-accent">
            {stock > 0 ? `Disponible · ${stock} unidades en stock` : "Agotado"}
          </p>

          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold text-primary">Conoce nuestros precios al por mayor</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {[
                product.priceTiers.unit,
                product.priceTiers.inner,
                product.priceTiers.master,
              ].map((tier) => (
                <div key={tier.label} className="rounded-lg bg-secondary p-3 text-sm">
                  <p className="font-medium text-foreground">{tier.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {tier.quantity === 1 ? "Compra individual" : `${tier.quantity} unidades`}
                  </p>
                  <p className="mt-2 font-bold text-primary">{formatCOP(tier.unitPrice)} / und</p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg border border-border p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Total para {qty} unidades</span>
                <span className="font-bold text-primary">{formatCOP(pricing.total)}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {pricing.breakdown.map((line) => (
                  <span key={line.key} className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                    {line.quantity} und a {formatCOP(line.unitPrice)}
                  </span>
                ))}
              </div>
              {pricing.suggestion && (
                <p className="mt-2 text-xs font-medium text-accent">{pricing.suggestion}</p>
              )}
            </div>
          </div>

          <p className="mt-4 text-muted-foreground text-pretty">{product.description}</p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg border border-border">
              <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Restar">
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center font-medium">{qty}</span>
              <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.min(stock, q + 1))} disabled={stock <= 0 || qty >= stock} aria-label="Sumar">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={handleAdd}
              disabled={stock <= 0 || qty > stock}
              className={cn("flex-1 gap-2 sm:flex-none", added ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90")}
            >
              {stock <= 0 ? "Agotado" : added ? <><Check className="h-4 w-4" /> Agregado</> : <><ShoppingCart className="h-4 w-4" /> Agregar al carrito</>}
            </Button>
            <Button onClick={buyNow} disabled={stock <= 0 || qty > stock} className="flex-1 gap-2 bg-accent text-accent-foreground hover:bg-accent/90 sm:flex-none">
              <Zap className="h-4 w-4" /> Comprar ahora
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Truck className="h-4 w-4 text-accent" /> Envío a toda Colombia
            </span>
            <span className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-accent" /> Garantía incluida
            </span>
            <span className="flex items-center gap-2 text-muted-foreground">
              <Barcode className="h-4 w-4 text-accent" /> SKU: {product.sku}
            </span>
            <span className="flex items-center gap-2 text-muted-foreground">
              <Barcode className="h-4 w-4 text-accent" /> Cód: {product.barcode}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <Tabs defaultValue="desc">
          <TabsList>
            <TabsTrigger value="desc">Descripción</TabsTrigger>
            <TabsTrigger value="specs">Especificaciones</TabsTrigger>
            <TabsTrigger value="compat">Compatibilidades</TabsTrigger>
          </TabsList>
          <TabsContent value="desc" className="max-w-3xl pt-4 text-muted-foreground text-pretty">
            {product.description} Diseñado para uso profesional y doméstico, este producto cumple con
            los estándares de calidad de {product.brand} y cuenta con garantía respaldada por FERREIA.
          </TabsContent>
          <TabsContent value="specs" className="pt-4">
            <dl className="grid max-w-2xl grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
              {product.specs.map((s) => (
                <div key={s.label} className="flex justify-between gap-4 bg-card px-4 py-3">
                  <dt className="text-muted-foreground">{s.label}</dt>
                  <dd className="font-medium text-foreground">{s.value}</dd>
                </div>
              ))}
            </dl>
          </TabsContent>
          <TabsContent value="compat" className="pt-4">
            {product.compatibilities.length ? (
              <ul className="max-w-2xl space-y-2">
                {product.compatibilities.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-foreground">
                    <Check className="h-4 w-4 text-accent" /> {c}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">Sin compatibilidades específicas registradas.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-14">
          <h2 className="mb-5 text-2xl font-bold text-primary">Productos relacionados</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
