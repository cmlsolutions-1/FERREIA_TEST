import Link from "next/link"
import {
  Wrench,
  Drill,
  Lightbulb,
  Hammer,
  Bolt,
  KeyRound,
  HardHat,
  PaintRoller,
  ArrowRight,
  MessageSquareText,
  Camera,
} from "lucide-react"
import { HomeHero } from "@/components/store/home-hero"
import { CustomerTestimonials } from "@/components/store/customer-testimonials"
import { PromotionsCatalog } from "@/components/store/promotions-catalog"
import { ProductCard } from "@/components/store/product-card"
import { Button } from "@/components/ui/button"
import type { Category, Product } from "@/lib/data"
import { serverApiRequest } from "@/services/server-api"

export const dynamic = "force-dynamic"

const ICONS: Record<string, React.ElementType> = {
  Wrench, Drill, Lightbulb, Hammer, Bolt, KeyRound, HardHat, PaintRoller,
}

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <h2 className="text-2xl font-bold tracking-tight text-primary text-balance">{title}</h2>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-sm font-medium text-accent hover:underline"
        >
          Ver todo <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}

export default async function HomePage() {
  const [productResponse, categoryResponse, brandResponse] = await Promise.all([
    serverApiRequest<Product[]>("/api/products?limit=100&active=true"),
    serverApiRequest<Category[]>("/api/categories?limit=100&active=true"),
    serverApiRequest<Array<{ name: string }>>("/api/brands?limit=100&active=true"),
  ])
  const PRODUCTS = productResponse.data
  const CATEGORIES = categoryResponse.data
  const BRANDS = brandResponse.data.map((brand) => brand.name)
  const destacados = PRODUCTS.slice(0, 5)
  const masVendidos = PRODUCTS.filter((p) => p.badge === "Más vendido")

  return (
    <>
      <HomeHero products={PRODUCTS} totalProducts={productResponse.meta?.total ?? PRODUCTS.length} />

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionHeader title="Categorías destacadas" href="/catalogo" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {CATEGORIES.map((c) => {
            const Icon = ICONS[c.icon] ?? Wrench
            return (
              <Link
                key={c.slug}
                href={`/catalogo?categoria=${c.slug}`}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-colors hover:border-accent hover:bg-accent/5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-xs font-medium leading-tight text-foreground">{c.name}</span>
                <span className="text-[11px] text-muted-foreground">{c.count} productos</span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Promo banner */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="grid gap-5 md:grid-cols-2">
          <article className="group relative min-h-64 overflow-hidden rounded-[1.75rem] border border-orange-300/20 bg-gradient-to-br from-[#70260f] via-[#b54516] to-[#e47724] p-7 text-white shadow-[0_20px_55px_rgba(127,48,15,0.20)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_65px_rgba(127,48,15,0.28)] sm:p-8">
            <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute bottom-0 right-6 h-32 w-32 translate-y-8 rounded-full border-[24px] border-white/[0.06]" />
            <PaintRoller className="pointer-events-none absolute bottom-4 right-7 h-24 w-24 rotate-[-8deg] text-white/[0.09] transition-transform duration-500 group-hover:rotate-0 group-hover:scale-105" />
            <div className="relative z-10 flex h-full flex-col items-center text-center">
              <h3 className="mt-3 max-w-md text-2xl font-black tracking-tight text-balance sm:text-[1.75rem]">Temporada de remodelación</h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-orange-50/90">
              Encuentra precios especiales en productos seleccionados de nuestra tienda.
              </p>
              <Button asChild className="mt-auto rounded-full bg-white px-5 text-[#8b310f] shadow-lg shadow-orange-950/15 hover:bg-orange-50 hover:text-[#70260f]">
                <Link href="/promociones">Ver ofertas <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-0.5" /></Link>
              </Button>
            </div>
          </article>

          <article className="group relative min-h-64 overflow-hidden rounded-[1.75rem] border border-sky-300/20 bg-gradient-to-br from-[#061c3f] via-[#073f76] to-[#0b72ae] p-7 text-white shadow-[0_20px_55px_rgba(3,48,94,0.20)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_65px_rgba(3,48,94,0.28)] sm:p-8">
            <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-sky-300/15 blur-2xl" />
            <div className="pointer-events-none absolute bottom-0 right-6 h-32 w-32 translate-y-8 rounded-full border-[24px] border-white/[0.06]" />
            <Drill className="pointer-events-none absolute bottom-4 right-7 h-24 w-24 rotate-[-8deg] text-white/[0.09] transition-transform duration-500 group-hover:rotate-0 group-hover:scale-105" />
            <div className="relative z-10 flex h-full flex-col items-center text-center">
              <h3 className="mt-3 max-w-md text-2xl font-black tracking-tight text-balance sm:text-[1.75rem]">Herramientas profesionales</h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-sky-50/85">
              Las mejores marcas para contratistas y maestros de obra.
              </p>
              <Button asChild className="mt-auto rounded-full bg-white px-5 text-[#073f76] shadow-lg shadow-blue-950/15 hover:bg-sky-50 hover:text-[#061c3f]">
                <Link href="/catalogo?categoria=herramientas-electricas">Comprar ahora <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-0.5" /></Link>
              </Button>
            </div>
          </article>
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionHeader title="Productos destacados" href="/catalogo" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {destacados.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* AI assistant callout */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="grid items-center gap-6 overflow-hidden rounded-2xl border border-border bg-secondary p-8 md:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
              <MessageSquareText className="h-3.5 w-3.5" /> Asistente Ferretero IA
            </span>
            <h2 className="mt-3 text-2xl font-bold text-primary text-balance">
              Cuéntale tu proyecto y arma tu lista de materiales
            </h2>
            <p className="mt-2 text-muted-foreground text-pretty">
              "Necesito instalar una lámpara", "Quiero construir un closet", "Necesito herramientas
              para drywall". La IA te recomienda materiales, herramientas y cantidades.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/asistente">
                  <MessageSquareText className="h-4 w-4" /> Abrir asistente
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2 bg-transparent">
                <Link href="/buscar-ia">
                  <Camera className="h-4 w-4" /> Buscar por foto
                </Link>
              </Button>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="space-y-3 text-sm">
              <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground">
                Necesito herramientas para instalar drywall
              </div>
              <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-sm bg-secondary px-3 py-2 text-foreground">
                Para drywall necesitas: atornillador, tornillos punta aguda, cinta, masilla,
                fresadora y nivel láser. ¿Agrego todo al carrito?
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best sellers */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionHeader title="Los más vendidos" href="/catalogo" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {masVendidos.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <PromotionsCatalog compact />

      {/* Brands */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionHeader title="Marcas destacadas" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {BRANDS.map((b) => (
            <div
              key={b}
              className="flex items-center justify-center rounded-xl border border-border bg-card px-4 py-6 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              {b}
            </div>
          ))}
        </div>
      </section>

      <CustomerTestimonials />
    </>
  )
}
