"use client"

import { useEffect, useState } from "react"
import { BadgeCheck, CheckCircle2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  purchaseReviewForOrder,
  savePurchaseReview,
  type PurchaseReview,
} from "@/lib/customer-experience"

export function PurchaseReviewForm({ orderId, customerName = "", city = "" }: { orderId: string; customerName?: string; city?: string }) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [name, setName] = useState(customerName)
  const [reviewCity, setReviewCity] = useState(city)
  const [comment, setComment] = useState("")
  const [saved, setSaved] = useState<PurchaseReview | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    setSaved(purchaseReviewForOrder(orderId))
  }, [orderId])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!rating) { setError("Selecciona una calificación de 1 a 5 estrellas."); return }
    if (!name.trim()) { setError("Escribe el nombre que deseas mostrar."); return }
    if (comment.trim().length < 10) { setError("Cuéntanos un poco más sobre tu experiencia."); return }
    setSaved(savePurchaseReview({ orderId, name: name.trim(), city: reviewCity.trim(), comment: comment.trim(), rating }))
    setError("")
  }

  if (saved) {
    return (
      <div className="mt-8 w-full rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-left text-emerald-900">
        <div className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-bold">Gracias por calificar tu compra</p><p className="mt-1 text-sm">Tu opinión de {saved.rating} estrellas quedó publicada como compra verificada y aparecerá en la página principal de este dispositivo.</p></div></div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="mt-8 w-full rounded-3xl border border-border bg-card p-5 text-left shadow-[0_18px_50px_rgba(2,44,92,0.08)] sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-ice text-brand-navy"><BadgeCheck className="h-5 w-5" /></span>
        <div><h2 className="font-bold text-foreground">¿Cómo fue tu experiencia?</h2><p className="mt-0.5 text-xs text-muted-foreground">Califica la compra {orderId}. La opinión se mostrará como compra verificada.</p></div>
      </div>
      <div className="mt-5 flex items-center gap-1" onMouseLeave={() => setHoveredRating(0)}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button key={value} type="button" onMouseEnter={() => setHoveredRating(value)} onFocus={() => setHoveredRating(value)} onClick={() => setRating(value)} className="rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange" aria-label={`${value} ${value === 1 ? "estrella" : "estrellas"}`}>
            <Star className={`h-8 w-8 transition ${value <= (hoveredRating || rating) ? "fill-amber-400 text-amber-400" : "text-border"}`} />
          </button>
        ))}
        <span className="ml-2 text-sm font-semibold text-muted-foreground">{rating ? `${rating} de 5` : "Selecciona"}</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-foreground">Nombre para mostrar<Input value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5" placeholder="Tu nombre" /></label>
        <label className="text-xs font-semibold text-foreground">Ciudad <span className="font-normal text-muted-foreground">(opcional)</span><Input value={reviewCity} onChange={(event) => setReviewCity(event.target.value)} className="mt-1.5" placeholder="Ej: Bogotá" /></label>
      </div>
      <label className="mt-3 block text-xs font-semibold text-foreground">Cuéntanos qué te gustó o qué podemos mejorar<textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={3} maxLength={420} className="mt-1.5 w-full resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none transition focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20" placeholder="La atención, el proceso de compra, la entrega..." /></label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className={`text-xs ${error ? "text-destructive" : "text-muted-foreground"}`}>{error || `${comment.length}/420 caracteres`}</span>
        <Button type="submit" className="bg-brand-orange text-white hover:bg-brand-orange/90">Publicar calificación</Button>
      </div>
    </form>
  )
}
