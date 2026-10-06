"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Phone, Mail, MapPin, Truck, ShieldCheck, CreditCard, Headphones } from "lucide-react"
import { COMPANY } from "@/lib/data"
import { getCategories, type CategoryRecord } from "@/services/categories.service"

const FEATURES = [
  { icon: Truck, title: "Envíos a toda Colombia", desc: "Despacho en 24-72h" },
  { icon: ShieldCheck, title: "Compra protegida", desc: "Garantía en cada producto" },
  { icon: CreditCard, title: "Pago seguro", desc: "Tarjeta, PSE y contra entrega" },
  { icon: Headphones, title: "Soporte experto", desc: "Asesoría ferretera real" },
]

export function SiteFooter() {
  const [CATEGORIES, setCategories] = useState<CategoryRecord[]>([])
  useEffect(() => { getCategories().then((result) => setCategories(result.data)).catch(() => {}) }, [])
  return (
    <footer className="mt-16 bg-brand-navy text-white">
      <div className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <f.icon className="h-8 w-8 shrink-0 text-brand-orange" />
              <div>
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="text-xs text-white/70">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <Link href="/" aria-label="Ir al inicio" className="flex h-14 w-44 items-center justify-center overflow-hidden">
            <Image src="/sinFondoBlanco.png" alt="TooList" width={176} height={176} className="h-44 w-44 max-w-none shrink-0" />
          </Link>
          <p className="mt-3 text-sm text-white/70 text-pretty">
            {COMPANY.tagline}. Herramientas, iluminación, carpintería y ferretería
            especializada con inteligencia artificial.
          </p>
          <div className="mt-4 space-y-2 text-sm text-white/80">
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-brand-orange" /> {COMPANY.phone}
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-brand-orange" /> {COMPANY.email}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-orange" /> {COMPANY.address}
            </p>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-orange">
            Categorías
          </h3>
          <ul className="space-y-2 text-sm text-white/80">
            {CATEGORIES.slice(0, 6).map((c) => (
              <li key={c.slug}>
                <Link href={`/catalogo?categoria=${c.slug}`} className="transition-colors hover:text-brand-orange">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-orange">
            Compañía
          </h3>
          <ul className="space-y-2 text-sm text-white/80">
            <li><Link href="/" className="transition-colors hover:text-brand-orange">Sobre TooList</Link></li>
            <li><Link href="/asistente" className="transition-colors hover:text-brand-orange">Asistente IA</Link></li>
            <li><Link href="/buscar-ia" className="transition-colors hover:text-brand-orange">Buscar por foto</Link></li>
            <li><Link href="/admin" className="transition-colors hover:text-brand-orange">Panel administrador</Link></li>
            <li><Link href="/catalogo" className="transition-colors hover:text-brand-orange">Catálogo completo</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-orange">
            Ayuda
          </h3>
          <ul className="space-y-2 text-sm text-white/80">
            <li><Link href="/rastrear-pedido" className="transition-colors hover:text-brand-orange">Rastrear pedido</Link></li>
            <li><Link href="/mi-cuenta" className="transition-colors hover:text-brand-orange">Mi cuenta</Link></li>
            <li><Link href="#" className="transition-colors hover:text-brand-orange">Devoluciones</Link></li>
            <li><Link href="#" className="transition-colors hover:text-brand-orange">Garantías</Link></li>
            <li><Link href="#" className="transition-colors hover:text-brand-orange">Términos y condiciones</Link></li>
            <li><Link href="#" className="transition-colors hover:text-brand-orange">Política de privacidad</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-white/60">
          © {new Date().getFullYear()} TooList — Plataforma Inteligente de Ferretería Digital
          para Colombia. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  )
}
