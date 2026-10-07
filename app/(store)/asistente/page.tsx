"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatCOP } from "@/lib/data"
import { prepareAdvisorImage } from "@/lib/ai-image"
import { requestProjectAdvice } from "@/services/ai.service"
import type { AdvisorHistoryMessage, AdvisorImage, CatalogProduct, ProjectPlan, VisionResult } from "@/server/modules/ai/ai.schema"
import { AlertTriangle, Calculator, ImagePlus, LoaderCircle, Send, ShieldCheck, Sparkles, User, Wrench, X } from "lucide-react"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  text: string
  products?: CatalogProduct[]
  image?: string
  imageName?: string
  vision?: VisionResult
  plan?: ProjectPlan
}

const FERREBOT_IMAGE = "/images/ferrebot-mascot-toollist.png"

const VISION_LABELS: Record<VisionResult["imageType"], string> = {
  furniture_project: "Proyecto o mueble",
  tool_or_product: "Herramienta o producto",
  other: "Imagen no relacionada",
  uncertain: "Objeto no identificado",
}

const VISION_PRESENTATION_LABELS: Record<VisionResult["imagePresentation"], string> = {
  photo: "Foto analizada",
  product_render: "Imagen de producto",
  technical_drawing: "Dibujo técnico",
  logo_or_text: "Logotipo o texto",
  interface_screenshot: "Captura de pantalla",
  uncertain: "Formato no identificado",
}

function visionLabel(vision: VisionResult) {
  if (["logo_or_text", "interface_screenshot", "uncertain"].includes(vision.imagePresentation)) {
    return VISION_PRESENTATION_LABELS[vision.imagePresentation]
  }
  return VISION_LABELS[vision.imageType]
}

function FerreBotAvatar({ large = false }: { large?: boolean }) {
  return (
    <div className={`relative shrink-0 overflow-hidden border-2 border-[#f15a24]/55 bg-gradient-to-br from-[#e7eef6] via-white to-[#fff0e8] shadow-[0_8px_24px_rgba(0,45,91,0.16)] ring-1 ring-[#002d5b]/10 ${large ? "h-20 w-20 rounded-3xl" : "h-16 w-16 rounded-2xl"}`}>
      <Image
        src={FERREBOT_IMAGE}
        alt={large ? "FerreBot completo, robot ferretero con casco y llave" : "Primer plano de FerreBot en la conversación"}
        fill
        sizes={large ? "80px" : "64px"}
        priority={large}
        className={large
          ? "object-contain p-1 drop-shadow-sm"
          : "translate-y-[18%] scale-[1.55] object-contain drop-shadow-sm"
        }
      />
    </div>
  )
}

function ProjectPlanCard({ plan }: { plan: ProjectPlan }) {
  return (
    <Card className="overflow-hidden border-primary/20 bg-card text-left shadow-sm">
      <div className="border-b border-border bg-gradient-to-r from-brand-navy/10 via-brand-ice to-brand-orange/10 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Calculator className="h-4 w-4 text-primary" />
              {plan.isBasic ? "Estimación del armado básico" : "Estimación del proyecto"}
            </div>
            <h3 className="font-bold text-foreground">{plan.title}</h3>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{plan.isBasic ? "Total básico" : "Total estimado"}</p>
            <p className="text-lg font-extrabold text-accent">{formatCOP(plan.total)}</p>
            <p className="text-[10px] text-muted-foreground">Solo materiales e insumos incorporados</p>
          </div>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{plan.summary}</p>
      </div>

      {plan.items.length > 0 && (
        <div className="space-y-2 p-3">
          {plan.items.map((item) => (
            <Link
              key={item.product.id}
              href={`/producto/${item.product.id}`}
              className="flex items-center gap-3 rounded-xl border border-border p-2 transition-colors hover:border-primary/40 hover:bg-muted/40"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image src={item.product.image || "/placeholder.svg"} alt={item.product.name} fill className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-xs font-semibold text-foreground">{item.product.name}</p>
                <p className="line-clamp-1 text-[11px] text-muted-foreground">{item.requirement} · {item.purpose}</p>
                <p className="text-[11px] text-muted-foreground">{item.quantity} × {formatCOP(item.unitPrice)}</p>
              </div>
              <p className="shrink-0 text-sm font-bold text-foreground">{formatCOP(item.subtotal)}</p>
            </Link>
          ))}
        </div>
      )}

      {plan.recommendedTools.length > 0 && (
        <div className="mx-3 mb-3 rounded-xl border border-[#002d5b]/20 bg-[#eef4fa] p-3 text-left">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#002d5b]">
            <Wrench className="h-4 w-4 text-[#f15a24]" />
            Herramientas que debes tener
          </div>
          <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">
            Se recomiendan para construir el proyecto, pero no forman parte del producto ni se suman al total.
          </p>
          <ul className="space-y-2">
            {plan.recommendedTools.map((tool) => (
              <li key={tool.name} className="rounded-lg border border-[#002d5b]/10 bg-white/75 px-3 py-2 text-xs">
                <p className="font-semibold text-[#002d5b]">{tool.name}</p>
                <p className="mt-0.5 text-muted-foreground">{tool.purpose} · {tool.note}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan.unavailable.length > 0 && (
        <div className="mx-3 mb-3 rounded-xl border border-amber-300/60 bg-amber-50 p-3 text-amber-950">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
            <AlertTriangle className="h-4 w-4" />
            También debes conseguir
          </div>
          <ul className="space-y-1 text-xs">
            {plan.unavailable.map((item) => (
              <li key={`${item.name}-${item.quantityDescription}`}>• <strong>{item.name}</strong> ({item.quantityDescription}): {item.purpose}</li>
            ))}
          </ul>
        </div>
      )}

      {plan.optionalAddOns.length > 0 && (
        <div className="mx-3 mb-3 rounded-xl border border-[#f15a24]/35 bg-[#fff4ed] p-3 text-[#4b2a1a]">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#002d5b]">
            <Sparkles className="h-4 w-4 text-[#f15a24]" />
            Opcionales para agregar después
          </div>
          {plan.optionalAddOns.map((item) => (
            <div key={item.name} className="text-xs leading-relaxed">
              <p><strong>{item.name}:</strong> {item.description}</p>
              <p className="mt-1 font-medium text-[#002d5b]">{item.followUpPrompt}</p>
            </div>
          ))}
        </div>
      )}

      {plan.steps.length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <p className="mb-2 text-xs font-semibold text-foreground">Pasos sugeridos</p>
          <ol className="space-y-1 text-xs leading-relaxed text-muted-foreground">
            {plan.steps.map((step, index) => <li key={step}>{index + 1}. {step}</li>)}
          </ol>
        </div>
      )}

      {plan.safetyNotes.length > 0 && (
        <div className="flex gap-2 border-t border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>{plan.safetyNotes.join(" ")}</p>
        </div>
      )}
      <p className="border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
        Estimación orientativa basada en las medidas suministradas y el inventario actual. Verifica medidas y compatibilidad antes de comprar o cortar.
      </p>
    </Card>
  )
}

const SUGGESTIONS = [
  "Quiero construir una mesa de centro",
  "Quiero construir un mueble para televisor",
  "Quiero comprar un taladro para concreto",
  "Quiero fabricar un televisor",
]

const INITIAL: ChatMessage[] = [
  {
    id: "m0",
    role: "assistant",
    text: "¡Hola! Soy FerreBot, el asistente de FERREIA. Cuéntame qué quieres construir, qué producto necesitas o adjunta una foto. Consultaré el inventario real antes de recomendarte algo.",
  },
]

export default function AsistentePage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL)
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const [processingImage, setProcessingImage] = useState(false)
  const [selectedImage, setSelectedImage] = useState<AdvisorImage | null>(null)
  const [imageError, setImageError] = useState("")
  const chatRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const suggestedQuery = new URLSearchParams(window.location.search).get("consulta")?.trim()
    if (suggestedQuery) setInput(suggestedQuery)
  }, [])

  useEffect(() => {
    const chat = chatRef.current
    if (chat) chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" })
  }, [messages, typing])

  async function send(value: string) {
    const trimmed = value.trim()
    const pendingImage = selectedImage
    if ((!trimmed && !pendingImage) || typing) return
    const messageText = trimmed || "Analiza esta imagen y dime qué producto o proyecto ves."
    const history: AdvisorHistoryMessage[] = messages.slice(1).slice(-8).map((message) => ({
      role: message.role,
      content: message.text,
    }))
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: messageText,
      image: pendingImage?.dataUrl,
      imageName: pendingImage?.name,
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setSelectedImage(null)
    setImageError("")
    setTyping(true)
    setProcessingImage(Boolean(pendingImage))
    try {
      const response = await requestProjectAdvice(messageText, history, pendingImage ?? undefined)
      setMessages((prev) => [...prev, {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: response.data.assistantMessage,
        products: response.data.catalog.products,
        vision: response.data.vision,
        plan: response.data.plan,
      }])
    } catch (error) {
      setMessages((prev) => [...prev, {
        id: `a-${Date.now()}`,
        role: "assistant",
        text: error instanceof Error ? error.message : "No fue posible consultar FerreBot en este momento.",
      }])
    } finally {
      setTyping(false)
      setProcessingImage(false)
    }
  }

  async function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    setImageError("")
    try {
      setSelectedImage(await prepareAdvisorImage(file))
    } catch (error) {
      setSelectedImage(null)
      setImageError(error instanceof Error ? error.message : "No fue posible preparar la foto.")
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    void send(input)
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col px-4 py-6">
      <header className="mb-5 flex items-center gap-4">
        <FerreBotAvatar large />
        <div>
          <h1 className="text-lg font-bold leading-tight text-foreground">FerreBot — Asistente Ferretero IA</h1>
          <p className="text-sm text-muted-foreground">Describe tu proyecto, adjunta una foto y recibe una estimación con inventario real</p>
        </div>
      </header>

      <div ref={chatRef} className="h-[48vh] min-h-[320px] max-h-[560px] space-y-4 overflow-y-auto rounded-2xl border border-border bg-muted/30 p-4 sm:min-h-[360px]">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            {m.role === "assistant" ? (
              <FerreBotAvatar />
            ) : (
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-accent text-accent-foreground">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}
            <div className={`space-y-3 ${m.role === "user" ? "max-w-[80%] items-end text-right" : "max-w-[calc(100%-4.75rem)] sm:max-w-[82%]"}`}>
              <div
                className={`inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-accent text-accent-foreground"
                    : "bg-card text-card-foreground shadow-sm"
                }`}
              >
                {m.image && (
                  <Image
                    src={m.image}
                    alt={m.imageName ? `Foto adjunta: ${m.imageName}` : "Foto adjunta"}
                    width={360}
                    height={270}
                    unoptimized
                    className="mb-2 max-h-64 w-full rounded-xl bg-white object-contain"
                  />
                )}
                {m.text}
              </div>
              {m.vision && (
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] text-muted-foreground">
                  <ImagePlus className="h-3.5 w-3.5 text-primary" />
                  <span>{visionLabel(m.vision)}</span>
                  <span aria-hidden="true">·</span>
                  <span>confianza estimada {Math.round(m.vision.confidence * 100)}%</span>
                </div>
              )}
              {m.plan && <ProjectPlanCard plan={m.plan} />}
              {!m.plan && m.products && m.products.length > 0 && (
                <div className="grid gap-2 text-left sm:grid-cols-3">
                  {m.products.map((p) => (
                      <Link key={p.id} href={`/producto/${p.id}`}>
                        <Card className="overflow-hidden p-2 transition-colors hover:border-accent">
                          <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-md bg-muted">
                            <Image src={p.image || "/placeholder.svg"} alt={p.name} fill className="object-cover" />
                          </div>
                          <p className="line-clamp-2 text-xs font-medium text-foreground">{p.name}</p>
                          <p className="mt-1 text-sm font-bold text-accent">{formatCOP(p.price)}</p>
                          <p className="text-[11px] text-muted-foreground">{p.stock > 0 ? `${p.stock} disponibles` : "Sin existencias"}</p>
                        </Card>
                      </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex gap-3">
            <FerreBotAvatar />
            <div className="inline-flex items-center gap-2 rounded-2xl bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
              {processingImage ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                  <span>Analizando la imagen y consultando el inventario…</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => void send(s)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              <Sparkles className="h-3 w-3 text-accent" />
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-2">
        {selectedImage && (
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-2">
            <Image
              src={selectedImage.dataUrl}
              alt={`Vista previa de ${selectedImage.name}`}
              width={64}
              height={64}
              unoptimized
              className="h-16 w-16 rounded-lg bg-white object-contain"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{selectedImage.name}</p>
              <p className="text-xs text-muted-foreground">Foto preparada para el análisis local</p>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-9 w-9 shrink-0"
              onClick={() => setSelectedImage(null)}
              disabled={typing}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Quitar foto</span>
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleImageSelect}
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-12 w-12 shrink-0"
            onClick={() => fileRef.current?.click()}
            disabled={typing}
            title="Adjuntar una foto"
          >
            <ImagePlus className="h-5 w-5" />
            <span className="sr-only">Adjuntar una foto</span>
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe tu proyecto o adjunta una foto..."
            className="h-12 flex-1"
            disabled={typing}
          />
          <Button
            type="submit"
            size="icon"
            className="h-12 w-12 shrink-0"
            disabled={(!input.trim() && !selectedImage) || typing}
          >
            <Send className="h-5 w-5" />
            <span className="sr-only">Enviar</span>
          </Button>
        </div>
        {imageError && <p className="text-xs text-destructive" role="alert">{imageError}</p>}
      </form>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        FerreBot consulta los productos activos del inventario. Las fotos se reducen a 768 px y no se guardan. La primera respuesta puede tardar mientras carga el modelo.
      </p>
    </div>
  )
}
