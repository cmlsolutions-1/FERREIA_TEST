"use client"

import { useEffect, useMemo, useState } from "react"
import { BadgeCheck, Quote } from "lucide-react"
import { RatingStars } from "@/components/store/product-card"
import {
  PURCHASE_REVIEW_UPDATED_EVENT,
  readPurchaseReviews,
  type PurchaseReview,
} from "@/lib/customer-experience"
import { TESTIMONIALS } from "@/lib/data"

type DisplayTestimonial = {
  id: string
  name: string
  role: string
  text: string
  rating: number
  verified: boolean
}

export function CustomerTestimonials() {
  const [reviews, setReviews] = useState<PurchaseReview[]>([])

  useEffect(() => {
    const refresh = () => setReviews(readPurchaseReviews())
    refresh()
    window.addEventListener(PURCHASE_REVIEW_UPDATED_EVENT, refresh)
    window.addEventListener("storage", refresh)
    return () => {
      window.removeEventListener(PURCHASE_REVIEW_UPDATED_EVENT, refresh)
      window.removeEventListener("storage", refresh)
    }
  }, [])

  const testimonials = useMemo<DisplayTestimonial[]>(() => [
    ...reviews.map((review) => ({
      id: review.id,
      name: review.name,
      role: review.city ? `Compra verificada · ${review.city}` : "Compra verificada",
      text: review.comment,
      rating: review.rating,
      verified: true,
    })),
    ...TESTIMONIALS.map((testimonial, index) => ({
      id: `featured-${index}`,
      name: testimonial.name,
      role: testimonial.role,
      text: testimonial.text,
      rating: testimonial.rating,
      verified: false,
    })),
  ].slice(0, 3), [reviews])

  return (
    <section className="bg-brand-navy py-14 text-white">
      <div className="mx-auto max-w-7xl px-4">
        <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-brand-orange">Experiencias TooList</p>
        <h2 className="mt-2 text-center text-2xl font-bold text-balance">Lo que dicen nuestros clientes</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article key={testimonial.id} className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.12)]">
              <div className="flex items-start justify-between gap-3"><Quote className="h-7 w-7 text-brand-orange" />{testimonial.verified && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-semibold text-emerald-200"><BadgeCheck className="h-3 w-3" /> Compra verificada</span>}</div>
              <p className="mt-3 min-h-16 text-sm leading-relaxed text-white/90 text-pretty">{testimonial.text}</p>
              <div className="mt-4"><RatingStars rating={testimonial.rating} /><p className="mt-2 text-sm font-semibold">{testimonial.name}</p><p className="text-xs text-white/60">{testimonial.role}</p></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
