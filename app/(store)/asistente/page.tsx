"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatCOP, type Product } from "@/lib/data"
import { getAllProducts } from "@/services/products.service"
import { Bot, Send, Sparkles, User } from "lucide-react"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  text: string
  productIds?: string[]
}

const SUGGESTIONS = [
  "¿Qué necesito para colgar un televisor en pared de drywall?",
  "Recomiéndame herramienta para pintar una habitación",
  "¿Qué taladro me sirve para concreto?",
  "Necesito asegurar una puerta, ¿qué cerradura compro?",
]

const INITIAL: ChatMessage[] = [
  {
    id: "m0",
    role: "assistant",
    text: "¡Hola! Soy FerreBot, tu asistente ferretero. Cuéntame qué proyecto tienes en mente o qué problema quieres resolver y te recomiendo los productos y materiales que necesitas.",
  },
]

function buildAssistantReply(input: string, products: Product[]): ChatMessage {
  const text = input.toLowerCase()
  let reply =
    "Con gusto te ayudo. Para tu proyecto te recomiendo revisar estos productos de nuestro catálogo, son los más adecuados y tienen buena rotación entre nuestros clientes:"
  let picks: Product[] = []

  if (text.includes("televisor") || text.includes("drywall") || text.includes("colgar") || text.includes("pared")) {
    reply =
      "Para colgar un televisor en pared de drywall necesitas un soporte con anclajes tipo mariposa, un taladro para hacer las perforaciones y un nivel para que quede derecho. Aquí tienes lo esencial:"
    picks = products.filter((p) =>
      ["herramientas-electricas", "tornilleria", "herramientas-manuales"].includes(p.category),
    ).slice(0, 3)
  } else if (text.includes("pintar") || text.includes("pintura") || text.includes("habitaci")) {
    reply =
      "Para pintar una habitación te recomiendo rodillos de buena calidad, cinta de enmascarar para proteger bordes y la pintura adecuada según el acabado que busques. Mira estas opciones:"
    picks = products.filter((p) => p.category === "pinturas-acabados").slice(0, 3)
  } else if (text.includes("concreto") || text.includes("taladro") || text.includes("perfora")) {
    reply =
      "Para perforar concreto necesitas un taladro percutor (rotomartillo) con brocas de tungsteno. Estos modelos tienen la potencia adecuada:"
    picks = products.filter((p) => p.subcategory === "Taladros" || p.category === "herramientas-electricas").slice(0, 3)
  } else if (text.includes("puerta") || text.includes("cerradura") || text.includes("asegurar") || text.includes("seguridad")) {
    reply =
      "Para asegurar una puerta lo ideal es una cerradura de alta seguridad con cilindro antibumping. Te recomiendo estas opciones de seguridad:"
    picks = products.filter((p) => p.category === "cerrajeria" || p.category === "seguridad-industrial").slice(0, 3)
  } else {
    picks = products.slice(0, 3)
  }

  return {
    id: `a-${Date.now()}`,
    role: "assistant",
    text: reply,
    productIds: picks.map((p) => p.id),
  }
}

export default function AsistentePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL)
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    getAllProducts({ active: true }).then((items) => { if (active) setProducts(items) }).catch(() => {})
    return () => { active = false }
  }, [])

  function send(value: string) {
    const trimmed = value.trim()
    if (!trimmed || typing) return
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", text: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setTyping(true)
    setTimeout(() => {
      setMessages((prev) => [...prev, buildAssistantReply(trimmed, products)])
      setTyping(false)
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
    }, 900)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    send(input)
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col px-4 py-6">
      <header className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Bot className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight text-foreground">FerreBot — Asistente Ferretero IA</h1>
          <p className="text-sm text-muted-foreground">Describe tu proyecto y recibe recomendaciones de productos</p>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-border bg-muted/30 p-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className={m.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}>
                {m.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <div className={`max-w-[80%] space-y-3 ${m.role === "user" ? "items-end text-right" : ""}`}>
              <div
                className={`inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-accent text-accent-foreground"
                    : "bg-card text-card-foreground shadow-sm"
                }`}
              >
                {m.text}
              </div>
              {m.productIds && m.productIds.length > 0 && (
                <div className="grid gap-2 text-left sm:grid-cols-3">
                  {m.productIds.map((pid) => {
                    const p = products.find((x) => x.id === pid)
                    if (!p) return null
                    return (
                      <Link key={pid} href={`/producto/${p.id}`}>
                        <Card className="overflow-hidden p-2 transition-colors hover:border-accent">
                          <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-md bg-muted">
                            <Image src={p.image || "/placeholder.svg"} alt={p.name} fill className="object-cover" />
                          </div>
                          <p className="line-clamp-2 text-xs font-medium text-foreground">{p.name}</p>
                          <p className="mt-1 text-sm font-bold text-accent">{formatCOP(p.price)}</p>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="inline-flex items-center gap-1 rounded-2xl bg-card px-4 py-3 shadow-sm">
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              <Sparkles className="h-3 w-3 text-accent" />
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta o describe tu proyecto..."
          className="h-12 flex-1"
        />
        <Button type="submit" size="icon" className="h-12 w-12 shrink-0" disabled={!input.trim() || typing}>
          <Send className="h-5 w-5" />
          <span className="sr-only">Enviar</span>
        </Button>
      </form>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        FerreBot es una demostración. Las recomendaciones consultan los productos activos del catálogo actual.
      </p>
    </div>
  )
}
