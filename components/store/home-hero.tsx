"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Camera, ShoppingBag, Truck, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function HomeHero() {
  const router = useRouter()
  const [query, setQuery] = useState("")

  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-accent" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-accent" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent">
            <Zap className="h-3.5 w-3.5" /> Ferretería potenciada con Inteligencia Artificial
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-balance md:text-5xl">
            Encuentra exactamente lo que necesitas para tu proyecto
          </h1>
          <p className="mt-4 max-w-md text-lg text-primary-foreground/80 text-pretty">
            Herramientas, iluminación, carpintería y ferretería especializada con envío a toda
            Colombia.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              router.push(`/catalogo${query ? `?q=${encodeURIComponent(query)}` : ""}`)
            }}
            className="mt-6 flex items-center gap-2 rounded-full bg-background p-1.5 shadow-lg"
          >
            <Search className="ml-3 h-5 w-5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej: bombillo LED, taladro, tornillos..."
              className="h-10 flex-1 border-0 bg-transparent text-foreground shadow-none focus-visible:ring-0"
            />
            <Button
              type="submit"
              className="rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Buscar
            </Button>
          </form>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              size="lg"
              className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => router.push("/catalogo")}
            >
              <ShoppingBag className="h-5 w-5" /> Comprar ahora
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => router.push("/buscar-ia")}
            >
              <Camera className="h-5 w-5" /> Buscar por fotografía
            </Button>
          </div>

          <div className="mt-6 flex items-center gap-2 text-sm text-primary-foreground/70">
            <Truck className="h-4 w-4 text-accent" />
            Envío gratis en compras superiores a $150.000
          </div>
        </div>

        <div className="relative hidden md:block">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/placeholder.svg?height=520&width=560&query=modern hardware tools store display"
              alt="Herramientas y productos de ferretería TooList"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-4 -left-4 rounded-xl bg-background p-4 text-foreground shadow-xl">
            <p className="text-2xl font-bold text-primary">+1.300</p>
            <p className="text-xs text-muted-foreground">productos disponibles</p>
          </div>
        </div>
      </div>
    </section>
  )
}
