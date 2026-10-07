"use client"

import { useEffect, useState } from "react"
import {
  CheckCircle2,
  ExternalLink,
  Headphones,
  MessageCircleMore,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  readLastCustomerOrder,
  saveSupportCase,
  SUPPORT_CONFIG,
  type SupportCase,
} from "@/lib/customer-experience"

const SUPPORT_OPTIONS = [
  { code: "1", subject: "Seguimiento de pedido", hint: "Consulta ubicación, guía y fecha estimada." },
  { code: "2", subject: "Queja sobre el servicio", hint: "Cuéntanos qué ocurrió durante tu atención." },
  { code: "3", subject: "Reclamo sobre una compra", hint: "Reporta un inconveniente con un pedido o producto." },
  { code: "4", subject: "Garantía o devolución", hint: "Recibe orientación para iniciar tu solicitud." },
  { code: "5", subject: "Felicitación o sugerencia", hint: "Comparte una buena experiencia o una idea." },
  { code: "6", subject: "Hablar con un asesor", hint: "Comunícate directamente con nuestro equipo." },
] as const

export function CustomerSupport() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<(typeof SUPPORT_OPTIONS)[number] | null>(null)
  const [orderId, setOrderId] = useState("")
  const [detail, setDetail] = useState("")
  const [createdCase, setCreatedCase] = useState<SupportCase | null>(null)

  useEffect(() => {
    if (!open) return
    const lastOrder = readLastCustomerOrder()
    if (lastOrder?.id) setOrderId(lastOrder.id)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open])

  function prepareCase() {
    if (!selected) return null
    const supportCase = saveSupportCase({
      option: selected.code,
      subject: selected.subject,
      orderId: orderId.trim(),
      detail: detail.trim(),
      channel: "whatsapp",
    })
    setCreatedCase(supportCase)
    return supportCase
  }

  function openWhatsApp() {
    const supportCase = prepareCase()
    if (!supportCase || !selected) return
    const message = [
      "Hola, equipo de atención al cliente de TooList.",
      `Caso ${supportCase.id}.`,
      `Opción ${selected.code}: ${selected.subject}.`,
      orderId.trim() ? `Número de pedido: ${orderId.trim()}.` : "",
      detail.trim() ? `Detalle: ${detail.trim()}` : "",
    ].filter(Boolean).join("\n")
    window.open(`https://wa.me/${SUPPORT_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer")
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full items-center gap-3 rounded-xl text-left outline-none transition focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-4 focus-visible:ring-offset-brand-navy"
        aria-haspopup="dialog"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-orange transition group-hover:bg-brand-orange group-hover:text-white">
          <Headphones className="h-6 w-6" />
        </span>
        <span>
          <span className="block text-sm font-semibold">Soporte 24/7</span>
          <span className="block text-xs text-white/70">Menú de ayuda, llamada y WhatsApp</span>
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-brand-navy/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="support-title" className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-card shadow-2xl sm:max-w-2xl sm:rounded-3xl">
            <header className="relative overflow-hidden bg-gradient-to-br from-brand-navy to-brand-blue px-5 py-5 text-white sm:px-7">
              <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-brand-orange/20 blur-2xl" />
              <button type="button" onClick={() => setOpen(false)} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20" aria-label="Cerrar soporte">
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-orange text-white shadow-lg"><Headphones className="h-6 w-6" /></span>
                <div>
                  <p className="text-xs font-semibold text-white/70">Atención al cliente</p>
                  <h2 id="support-title" className="text-xl font-bold">¿Cómo podemos ayudarte?</h2>
                </div>
              </div>
            </header>

            <div className="space-y-5 p-5 sm:p-7">
              <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-brand-ice px-4 py-3 text-sm leading-relaxed text-brand-navy">
                <strong>Hola, ¿cómo estás?</strong> Te habla {SUPPORT_CONFIG.agentName}, del equipo de atención al cliente. Elige una opción para preparar tu caso.
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {SUPPORT_OPTIONS.map((option) => (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => { setSelected(option); setCreatedCase(null) }}
                    className={`flex gap-3 rounded-xl border p-3 text-left transition ${selected?.code === option.code ? "border-brand-orange bg-brand-orange/5 shadow-sm" : "border-border bg-card hover:border-brand-blue/40 hover:bg-muted/40"}`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black ${selected?.code === option.code ? "bg-brand-orange text-white" : "bg-brand-ice text-brand-navy"}`}>{option.code}</span>
                    <span><span className="block text-sm font-semibold text-foreground">{option.subject}</span><span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{option.hint}</span></span>
                  </button>
                ))}
              </div>

              {selected && (
                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                  <p className="text-sm font-bold text-foreground">Opción {selected.code}: {selected.subject}</p>
                  {(selected.code === "1" || selected.code === "3" || selected.code === "4") && (
                    <label className="mt-3 block text-xs font-semibold text-foreground">
                      Número del pedido
                      <Input value={orderId} onChange={(event) => setOrderId(event.target.value)} className="mt-1.5 bg-card" placeholder="Ej: FE-10235" />
                      {orderId && <span className="mt-1.5 block font-normal text-muted-foreground">Encontramos y completamos tu pedido más reciente. Puedes cambiarlo si es otro.</span>}
                    </label>
                  )}
                  <label className="mt-3 block text-xs font-semibold text-foreground">
                    {selected.code === "5" ? "Tu mensaje" : "Cuéntanos brevemente qué necesitas"}
                    <textarea value={detail} onChange={(event) => setDetail(event.target.value)} rows={3} className="mt-1.5 w-full resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20" placeholder="Escribe aquí los detalles para que el asesor tenga el contexto..." />
                  </label>
                </div>
              )}

              {createdCase && (
                <div className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Tu referencia de soporte es <strong>{createdCase.id}</strong>. Guárdala para identificar el caso.</span>
                </div>
              )}

              <div className="flex justify-center">
                <Button type="button" onClick={openWhatsApp} disabled={!selected} className="h-12 w-full max-w-md rounded-xl bg-[#168B52] px-6 text-white shadow-sm hover:bg-[#117344]">
                  <MessageCircleMore className="h-5 w-5" /> Continuar por WhatsApp <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-center text-[11px] text-muted-foreground">El menú prepara la información del caso y abre WhatsApp con el mensaje listo para enviar al {SUPPORT_CONFIG.phone}.</p>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
