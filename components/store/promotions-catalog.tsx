"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, BadgePercent, ShoppingBag, Tag } from "lucide-react"
import { ProductCard } from "@/components/store/product-card"
import type { Product } from "@/lib/data"
import { getAllProducts } from "@/services/products.service"

export function PromotionsCatalog({ compact = false }: { compact?: boolean }) {
  const [filter, setFilter] = useState<"todas" | "promocion" | "outlet">("todas")
  const [entries, setEntries] = useState<Array<{ product: Product; promotion: { kind: "promocion" | "outlet" } }>>([])
  useEffect(() => { let active = true; getAllProducts({ active: true }).then((products) => { if (active) setEntries(products.filter((product) => product.oldPrice && product.oldPrice > product.price).map((product) => ({ product: product as Product, promotion: { kind: product.badge === "Outlet" ? "outlet" : "promocion" } }))) }).catch(() => {}); return () => { active = false } }, [])
  const shown = compact ? entries.slice(0, 5) : entries.filter((entry) => filter === "todas" || entry.promotion.kind === filter)

  if (compact) return <section className="bg-secondary py-12"><div className="mx-auto max-w-7xl px-4"><div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-rose-700">Precios especiales</p><h2 className="text-2xl font-bold text-primary">Promociones y Outlet</h2></div><Link href="/promociones" className="flex items-center gap-1 text-sm font-semibold text-accent">Ver todo <ArrowRight className="h-4 w-4" /></Link></div>{shown.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">{shown.map(({ product }) => <ProductCard key={product.sku} product={product} />)}</div> : <p className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">Pronto habrá nuevos precios especiales.</p>}</div></section>

  return <main className="mx-auto max-w-7xl px-4 py-8"><div className="overflow-hidden rounded-2xl bg-primary px-6 py-8 text-primary-foreground md:px-10"><div className="flex items-center gap-2 text-sm font-semibold text-amber-300"><BadgePercent className="h-5 w-5" /> Precios especiales</div><h1 className="mt-2 text-3xl font-black md:text-4xl">Promociones y Outlet</h1><p className="mt-2 max-w-2xl text-sm text-primary-foreground/80">Descubre artículos con precio rebajado.</p></div><div className="mt-6 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2">{([ ["todas", "Todas"], ["promocion", "Promociones"], ["outlet", "Outlet"] ] as const).map(([id, label]) => <button key={id} type="button" onClick={() => setFilter(id)} className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === id ? "bg-accent text-accent-foreground" : "border bg-card text-muted-foreground hover:text-primary"}`}>{label}</button>)}</div><span className="flex items-center gap-1 text-sm text-muted-foreground"><Tag className="h-4 w-4" />{shown.length} artículos</span></div>{shown.length ? <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{shown.map(({ product }) => <ProductCard key={product.sku} product={product} />)}</div> : <div className="mt-5 rounded-xl border border-dashed p-12 text-center"><ShoppingBag className="mx-auto h-9 w-9 text-muted-foreground" /><h2 className="mt-3 font-semibold">No hay descuentos vigentes en esta sección</h2><Link href="/catalogo" className="mt-2 inline-block text-sm text-accent hover:underline">Explorar el catálogo</Link></div>}</main>
}
