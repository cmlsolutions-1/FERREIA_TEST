"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bot, Camera, PackageSearch, Search, ShieldCheck, Sparkles, Truck } from "lucide-react"
import { PromotionHeroCarousel } from "@/components/store/promotion-hero-carousel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Product } from "@/lib/data"

type SearchMode = "ai" | "catalog"

export function HomeHero({ products, totalProducts }: { products: Product[]; totalProducts: number }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<SearchMode>("ai")

  function handleSearch() {
    const value = query.trim()
    if (mode === "ai") {
      router.push(`/asistente${value ? `?consulta=${encodeURIComponent(value)}` : ""}`)
      return
    }
    router.push(`/catalogo${value ? `?q=${encodeURIComponent(value)}` : ""}`)
  }

  return (
    <section className="relative overflow-hidden border-b border-border/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(237,244,251,0.78)_52%,rgba(255,244,235,0.74)_100%)] dark:bg-[linear-gradient(135deg,rgba(7,21,34,0.98)_0%,rgba(17,42,68,0.92)_55%,rgba(58,30,13,0.70)_100%)]">
      <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-brand-blue/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-brand-orange/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-9 px-4 py-10 lg:grid-cols-[.92fr_1.08fr] lg:py-14">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-orange/20 bg-brand-orange/10 px-3 py-1.5 text-xs font-bold text-brand-orange">
            <Sparkles className="h-3.5 w-3.5" /> FerreBot conectado al inventario real
          </span>
          <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.04] tracking-[-0.035em] text-brand-navy text-balance md:text-5xl dark:text-foreground">
            Busca productos o cuéntale tu proyecto a <span className="text-brand-orange">FerreBot</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty md:text-lg">
            Recibe recomendaciones basadas en el catálogo disponible o encuentra directamente la herramienta, el material o el producto que necesitas.
          </p>

          <div className="mt-7">
            <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2" role="tablist" aria-label="Tipo de búsqueda">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "ai"}
                onClick={() => setMode("ai")}
                className={`relative flex items-center gap-2 pb-2 text-sm font-bold transition ${mode === "ai" ? "text-brand-navy dark:text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Bot className="h-4 w-4" /> Modo IA
                {mode === "ai" && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-orange" />}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "catalog"}
                onClick={() => setMode("catalog")}
                className={`relative flex items-center gap-2 pb-2 text-sm font-bold transition ${mode === "catalog" ? "text-brand-navy dark:text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <PackageSearch className="h-4 w-4" /> Productos
                {mode === "catalog" && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-orange" />}
              </button>
              <Link href="/buscar-ia" className="flex items-center gap-2 pb-2 text-sm font-bold text-muted-foreground transition hover:text-brand-orange">
                <Camera className="h-4 w-4" /> Buscar con foto
              </Link>
            </div>

            <div className="rounded-[1.6rem] bg-gradient-to-r from-brand-orange via-[#ff8a3d] to-brand-navy p-[1.5px] shadow-[0_18px_45px_rgba(2,44,92,0.12)]">
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  handleSearch()
                }}
                className="rounded-[calc(1.6rem-1.5px)] bg-card p-2"
              >
                <div className="flex items-center gap-2">
                  {mode === "ai" ? <Sparkles className="ml-2 h-5 w-5 shrink-0 text-brand-orange" /> : <Search className="ml-2 h-5 w-5 shrink-0 text-brand-blue" />}
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={mode === "ai" ? "Ej: quiero construir una mesa de centro..." : "Ej: taladro, bisagra, bombillo LED..."}
                    aria-label={mode === "ai" ? "Describe tu proyecto" : "Buscar productos"}
                    className="h-12 flex-1 border-0 bg-transparent px-1 text-foreground shadow-none focus-visible:bg-transparent focus-visible:ring-0"
                  />
                  <Button type="submit" className="h-11 rounded-full bg-brand-orange px-5 text-white shadow-sm hover:bg-brand-orange/90">
                    {mode === "ai" ? "Preguntar" : "Buscar"}
                  </Button>
                </div>
              </form>
            </div>
            <p className="mt-2.5 text-xs text-muted-foreground">
              {mode === "ai"
                ? "FerreBot analizará tu solicitud con precios y existencias del catálogo actual."
                : `Consulta entre ${totalProducts.toLocaleString("es-CO")} productos disponibles.`}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-brand-orange" /> Envíos a toda Colombia</span>
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-blue" /> Compra protegida</span>
          </div>
        </div>

        <PromotionHeroCarousel products={products} />
      </div>
    </section>
  )
}
