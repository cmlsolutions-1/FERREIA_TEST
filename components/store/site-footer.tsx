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
    <footer className="mt-16 bg-primary text-primary-foreground">
      <div className="border-b border-white/10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <f.icon className="h-8 w-8 shrink-0 text-accent" />
              <div>
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="text-xs text-primary-foreground/70">{f.desc}</p>
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
          <p className="mt-3 text-sm text-primary-foreground/70 text-pretty">
            {COMPANY.tagline}. Herramientas, iluminación, carpintería y ferretería
            especializada con inteligencia artificial.
          </p>
          <div className="mt-4 space-y-2 text-sm text-primary-foreground/80">
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-accent" /> {COMPANY.phone}
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-accent" /> {COMPANY.email}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" /> {COMPANY.address}
            </p>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent">
            Categorías
          </h3>
          <ul className="space-y-2 text-sm text-primary-foreground/80">
            {CATEGORIES.slice(0, 6).map((c) => (
              <li key={c.slug}>
                <Link href={`/catalogo?categoria=${c.slug}`} className="hover:text-accent">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent">
            Compañía
          </h3>
          <ul className="space-y-2 text-sm text-primary-foreground/80">
            <li><Link href="/" className="hover:text-accent">Sobre TooList</Link></li>
            <li><Link href="/asistente" className="hover:text-accent">Asistente IA</Link></li>
            <li><Link href="/buscar-ia" className="hover:text-accent">Buscar por foto</Link></li>
            <li><Link href="/admin" className="hover:text-accent">Panel administrador</Link></li>
            <li><Link href="/catalogo" className="hover:text-accent">Catálogo completo</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent">
            Ayuda
          </h3>
          <ul className="space-y-2 text-sm text-primary-foreground/80">
            <li><Link href="/rastrear-pedido" className="hover:text-accent">Rastrear pedido</Link></li>
            <li><Link href="/mi-cuenta" className="hover:text-accent">Mi cuenta</Link></li>
            <li><Link href="#" className="hover:text-accent">Devoluciones</Link></li>
            <li><Link href="#" className="hover:text-accent">Garantías</Link></li>
            <li><Link href="#" className="hover:text-accent">Términos y condiciones</Link></li>
            <li><Link href="#" className="hover:text-accent">Política de privacidad</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-4 text-center text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} TooList — Plataforma Inteligente de Ferretería Digital
          para Colombia. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  )
}
