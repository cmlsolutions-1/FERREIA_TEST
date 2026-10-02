"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { AlertCircle, Camera, Check, Loader2, ScanLine, Sparkles, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProductCard, RatingStars } from "@/components/store/product-card"
import { useCart } from "@/components/cart-provider"
import { formatCOP } from "@/lib/data"
import { prepareAdvisorImage } from "@/lib/ai-image"
import { requestProjectAdvice } from "@/services/ai.service"
import { getProductById, type ProductRecord } from "@/services/products.service"
import type { ProjectAdvisorResponse } from "@/server/modules/ai/ai.schema"

type Phase = "idle" | "scanning" | "result"

export default function BuscarIaPage() {
  const { addItem } = useCart()
  const inputRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>("idle")
  const [preview, setPreview] = useState<string | null>(null)
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [analysis, setAnalysis] = useState<ProjectAdvisorResponse | null>(null)
  const [error, setError] = useState("")
  const [added, setAdded] = useState(false)

  const match = products[0]
  const similares = products.slice(1, 5)
  const catalogMatch = match
    ? analysis?.catalog.products.find((product) => product.id === match.id)
    : undefined
  const isDirectMatch = catalogMatch?.matchType === "direct"

  function resetSearch() {
    setPhase("idle")
    setPreview(null)
    setProducts([])
    setAnalysis(null)
    setError("")
    setAdded(false)
    if (inputRef.current) inputRef.current.value = ""
  }

  async function handleFile(file?: File) {
    if (!file) return

    setPhase("scanning")
    setProducts([])
    setAnalysis(null)
    setError("")
    setAdded(false)

    try {
      const image = await prepareAdvisorImage(file)
      setPreview(image.dataUrl)

      const response = await requestProjectAdvice(
        "Identifica el producto principal visible en la foto y busca las coincidencias más precisas disponibles en el catálogo.",
        [],
        image,
      )
      setAnalysis(response.data)

      const productRequests = await Promise.allSettled(
        response.data.catalog.products.map((product) => getProductById(product.id)),
      )
      const records = productRequests.flatMap((result) =>
        result.status === "fulfilled" ? [result.value.data] : [],
      )
      setProducts(records)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible analizar la imagen.")
    } finally {
      setPhase("result")
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
          <Sparkles className="h-3.5 w-3.5" /> Búsqueda inteligente con IA
        </span>
        <h1 className="mt-3 text-3xl font-bold text-primary text-balance">
          Toma una foto y encuentra el producto en el catálogo
        </h1>
        <p className="mt-2 text-muted-foreground text-pretty">
          Sube la foto de un bombillo, herramienta o repuesto. FerreBot analizará el objeto y buscará coincidencias reales.
        </p>
      </div>

      {phase === "idle" && (
        <div className="mx-auto mt-8 max-w-xl">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border bg-card p-12 text-center transition-colors hover:border-accent hover:bg-accent/5"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-accent">
              <Camera className="h-8 w-8" />
            </span>
            <span className="text-lg font-semibold text-primary">Subir o tomar fotografía</span>
            <span className="text-sm text-muted-foreground">JPG, PNG o WEBP · hasta 10 MB</span>
            <span className="mt-2 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
              <Upload className="h-4 w-4" /> Seleccionar imagen
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Para un mejor resultado, usa una foto clara donde el producto ocupe la mayor parte de la imagen.
          </p>
        </div>
      )}

      {phase === "scanning" && (
        <div className="mx-auto mt-8 max-w-md text-center">
          <div className="relative mx-auto h-64 w-64 overflow-hidden rounded-2xl border border-border bg-secondary">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Imagen analizada" className="h-full w-full object-contain" />
            ) : (
              <div className="h-full w-full animate-pulse bg-secondary" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-primary/40">
              <ScanLine className="h-12 w-12 animate-pulse text-accent" />
            </div>
          </div>
          <p className="mt-4 flex items-center justify-center gap-2 font-medium text-primary">
            <Loader2 className="h-4 w-4 animate-spin" /> Analizando imagen con IA...
          </p>
          <p className="text-sm text-muted-foreground">Identificando el objeto y comparándolo con el catálogo</p>
        </div>
      )}

      {phase === "result" && match && (
        <div className="mt-8">
          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6">
            <Badge className="border-0 bg-accent text-accent-foreground">
              <Check className="mr-1 h-3.5 w-3.5" />
              {isDirectMatch ? "Coincidencia directa" : "Resultado más cercano"}
            </Badge>

            {analysis?.vision && (
              <div className="mt-3 rounded-lg border border-border/70 bg-background/70 px-4 py-3 text-sm">
                <p className="font-medium text-primary">
                  Detectado: {analysis.vision.detectedObject}
                  <span className="ml-2 font-normal text-muted-foreground">
                    ({Math.round(analysis.vision.confidence * 100)}% de confianza)
                  </span>
                </p>
                <p className="mt-1 text-muted-foreground">{analysis.assistantMessage}</p>
              </div>
            )}

            <div className="mt-5 grid gap-6 md:grid-cols-[260px_1fr]">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
                <figure>
                  <figcaption className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Foto enviada</figcaption>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview || match.image} alt="Fotografía enviada" className="h-36 w-full rounded-xl border bg-background object-contain" />
                </figure>
                <figure>
                  <figcaption className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Producto del catálogo</figcaption>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={match.image} alt={match.name} className="h-36 w-full rounded-xl border bg-background object-contain" />
                </figure>
              </div>

              <div>
                <p className="text-sm uppercase text-accent">{match.brand}</p>
                <h2 className="text-2xl font-bold text-primary">{match.name}</h2>
                <p className="mt-1 text-sm font-medium text-muted-foreground">Referencia: {match.sku}</p>
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
                  <dd className="font-medium">{match.compatibilities.length ? match.compatibilities.join(", ") : "No registradas"}</dd>
                </dl>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => {
                      addItem(match)
                      setAdded(true)
                      window.setTimeout(() => setAdded(false), 1500)
                    }}
                  >
                    {added ? <><Check className="h-4 w-4" /> Agregado</> : "Agregar al carrito"}
                  </Button>
                  <Button asChild variant="outline" className="bg-transparent">
                    <Link href={`/producto/${match.id}`}>Ver detalle</Link>
                  </Button>
                  <Button variant="ghost" onClick={resetSearch}>Analizar otra foto</Button>
                </div>
              </div>
            </div>
          </div>

          {similares.length > 0 && (
            <>
              <h3 className="mb-4 mt-10 text-xl font-bold text-primary">Otras coincidencias posibles</h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {similares.map((product) => <ProductCard key={product.id} product={product} />)}
              </div>
            </>
          )}
        </div>
      )}

      {phase === "result" && !match && (
        <div className="mx-auto mt-8 max-w-xl rounded-xl border border-dashed p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 font-semibold text-primary">No encontramos una coincidencia confiable</h2>
          {analysis?.vision?.detectedObject && (
            <p className="mt-2 text-sm text-muted-foreground">
              La imagen parece contener: {analysis.vision.detectedObject} ({Math.round(analysis.vision.confidence * 100)}% de confianza).
            </p>
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            {error || analysis?.assistantMessage || "Intenta con otra foto donde el producto se vea completo, enfocado y con buena iluminación."}
          </p>
          <Button variant="outline" className="mt-5 bg-transparent" onClick={resetSearch}>Analizar otra foto</Button>
        </div>
      )}
    </div>
  )
}
