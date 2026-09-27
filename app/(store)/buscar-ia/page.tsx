"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Camera, Upload, Sparkles, Loader2, ScanLine, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProductCard, RatingStars } from "@/components/store/product-card"
import { useCart } from "@/components/cart-provider"
import { formatCOP, type Product } from "@/lib/data"
import { getProducts } from "@/services/products.service"

type Phase = "idle" | "scanning" | "result"

export default function BuscarIaPage() {
  const { addItem } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [phase, setPhase] = useState<Phase>("idle")
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const match = products[0]
  const similares = match ? products.filter((product) => product.id !== match.id && product.category === match.category).slice(0, 4) : []
  const [added, setAdded] = useState(false)

  useEffect(() => {
    let active = true
    getProducts({ active: true, page: 1, limit: 12 }).then((result) => { if (active) setProducts(result.data) }).catch(() => {})
    return () => { active = false }
  }, [])

  function handleFile(file?: File) {
    if (file) setPreview(URL.createObjectURL(file))
    setPhase("scanning")
    setTimeout(() => setPhase("result"), 2200)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
          <Sparkles className="h-3.5 w-3.5" /> Búsqueda inteligente con IA
        </span>
        <h1 className="mt-3 text-3xl font-bold text-primary text-balance">
          Toma una foto y encuentra el producto exacto
        </h1>
        <p className="mt-2 text-muted-foreground text-pretty">
          Sube la foto de un bombillo, herramienta o repuesto y nuestra IA lo identifica al instante.
        </p>
      </div>

      {phase === "idle" && (
        <div className="mx-auto mt-8 max-w-xl">
          <button
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card p-12 text-center transition-colors hover:border-accent hover:bg-accent/5"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-accent">
              <Camera className="h-8 w-8" />
            </span>
            <span className="text-lg font-semibold text-primary">Subir o tomar fotografía</span>
            <span className="text-sm text-muted-foreground">JPG, PNG o HEIC · hasta 10MB</span>
            <span className="mt-2 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
              <Upload className="h-4 w-4" /> Seleccionar imagen
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <p className="mt-4 text-center text-xs text-muted-foreground">
            ¿Sin foto a la mano? <button onClick={() => handleFile()} className="text-accent hover:underline">Prueba con un ejemplo</button>
          </p>
        </div>
      )}

      {phase === "scanning" && (
        <div className="mx-auto mt-8 max-w-md text-center">
          <div className="relative mx-auto h-64 w-64 overflow-hidden rounded-2xl border border-border bg-secondary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview || "/placeholder.svg?height=256&width=256&query=led bulb photo"}
              alt="Imagen analizada"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-primary/40">
              <ScanLine className="h-12 w-12 animate-pulse text-accent" />
            </div>
          </div>
          <p className="mt-4 flex items-center justify-center gap-2 font-medium text-primary">
            <Loader2 className="h-4 w-4 animate-spin" /> Analizando imagen con IA...
          </p>
          <p className="text-sm text-muted-foreground">Identificando marca, modelo y compatibilidades</p>
        </div>
      )}

      {phase === "result" && match && (
        <div className="mt-8">
          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6">
            <Badge className="border-0 bg-accent text-accent-foreground">
              <Check className="mr-1 h-3.5 w-3.5" /> Producto identificado
            </Badge>
            <div className="mt-4 grid gap-6 md:grid-cols-[200px_1fr]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview || match.image}
                alt={match.name}
                className="h-48 w-full rounded-xl object-cover md:w-48"
              />
              <div>
                <p className="text-sm uppercase text-accent">{match.brand}</p>
                <h2 className="text-2xl font-bold text-primary">{match.name}</h2>
                <div className="mt-1 flex items-center gap-2">
                  <RatingStars rating={match.rating} />
                  <span className="text-sm text-muted-foreground">({match.reviews})</span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-y-1 text-sm">
                  <dt className="text-muted-foreground">Marca</dt>
                  <dd className="font-medium">{match.brand}</dd>
                  <dt className="text-muted-foreground">Precio</dt>
                  <dd className="font-medium text-primary">{formatCOP(match.price)}</dd>
                  <dt className="text-muted-foreground">Disponibilidad</dt>
                  <dd className="font-medium text-accent">{match.stock} en stock</dd>
                  <dt className="text-muted-foreground">Compatibilidades</dt>
                  <dd className="font-medium">{match.compatibilities.join(", ")}</dd>
                </dl>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => {
                      addItem(match)
                      setAdded(true)
                      setTimeout(() => setAdded(false), 1500)
                    }}
                  >
                    {added ? <><Check className="h-4 w-4" /> Agregado</> : "Agregar al carrito"}
                  </Button>
                  <Button asChild variant="outline" className="bg-transparent">
                    <Link href={`/producto/${match.id}`}>Ver detalle</Link>
                  </Button>
                  <Button variant="ghost" onClick={() => setPhase("idle")}>
                    Analizar otra foto
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <h3 className="mb-4 mt-10 text-xl font-bold text-primary">Productos similares</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {similares.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
      {phase === "result" && !match && <p className="mt-8 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No fue posible consultar el catálogo de productos. Intenta nuevamente.</p>}
    </div>
  )
}
