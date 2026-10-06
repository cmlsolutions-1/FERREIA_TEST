"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  Camera,
  Mic,
  Search,
  ShoppingCart,
  Menu,
  Phone,
  MapPin,
  Sparkles,
  User,
  LayoutDashboard,
  PackageSearch,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useCart } from "@/components/cart-provider"
import { useCustomerSession } from "@/components/customer-session-provider"
import { COMPANY } from "@/lib/data"
import { getCategories, type CategoryRecord } from "@/services/categories.service"
import { cn } from "@/lib/utils"

function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label="Ir al inicio" className={cn("flex shrink-0 items-center", className)}>
      <span className="flex h-11 w-[152px] items-center justify-center overflow-hidden">
        <Image src="/sinFondoColor.png" alt="ToolList" width={152} height={152} priority className="h-[152px] w-[152px] max-w-none shrink-0" />
      </span>
    </Link>
  )
}

export function SiteHeader() {
  const [CATEGORIES, setCategories] = useState<CategoryRecord[]>([])
  useEffect(() => { getCategories().then((result) => setCategories(result.data)).catch(() => {}) }, [])
  const router = useRouter()
  const pathname = usePathname()
  const { count } = useCart()
  const { user, logout } = useCustomerSession()
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const categoryScrollRef = useRef<HTMLDivElement>(null)
  const [canScrollCategoriesLeft, setCanScrollCategoriesLeft] = useState(false)
  const [canScrollCategoriesRight, setCanScrollCategoriesRight] = useState(false)
  const allCatalogActive = pathname === "/catalogo" && !activeCategory

  const updateCategoryScrollControls = useCallback(() => {
    const container = categoryScrollRef.current
    if (!container) return
    setCanScrollCategoriesLeft(container.scrollLeft > 2)
    setCanScrollCategoriesRight(container.scrollLeft + container.clientWidth < container.scrollWidth - 2)
  }, [])

  useEffect(() => {
    function syncCategoryFromUrl() {
      setActiveCategory(
        window.location.pathname === "/catalogo"
          ? new URLSearchParams(window.location.search).get("categoria")
          : null,
      )
    }
    syncCategoryFromUrl()
    window.addEventListener("popstate", syncCategoryFromUrl)
    return () => window.removeEventListener("popstate", syncCategoryFromUrl)
  }, [pathname])

  useEffect(() => {
    const container = categoryScrollRef.current
    if (!container) return
    updateCategoryScrollControls()
    container.addEventListener("scroll", updateCategoryScrollControls, { passive: true })
    const resizeObserver = new ResizeObserver(updateCategoryScrollControls)
    resizeObserver.observe(container)
    return () => {
      container.removeEventListener("scroll", updateCategoryScrollControls)
      resizeObserver.disconnect()
    }
  }, [updateCategoryScrollControls])

  useEffect(() => {
    const container = categoryScrollRef.current
    if (!container) return
    const selector = activeCategory ? `[data-category="${activeCategory}"]` : '[data-category="all"]'
    const activeLink = container.querySelector<HTMLElement>(selector)
    if (!activeLink) return
    container.scrollTo({
      left: activeLink.offsetLeft - (container.clientWidth - activeLink.clientWidth) / 2,
      behavior: "smooth",
    })
  }, [activeCategory])

  function scrollCategories(direction: -1 | 1) {
    const container = categoryScrollRef.current
    if (!container) return
    container.scrollBy({ left: direction * Math.max(260, container.clientWidth * 0.7), behavior: "smooth" })
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    setActiveCategory(null)
    router.push(`/catalogo${query ? `?q=${encodeURIComponent(query)}` : ""}`)
  }

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top utility bar */}
      <div className="hidden bg-brand-navy text-white md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-brand-orange" /> {COMPANY.phone}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-brand-orange" /> Envíos a toda Colombia
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/rastrear-pedido" className="flex items-center gap-1 transition-colors hover:text-brand-orange">
              <PackageSearch className="h-3.5 w-3.5" /> Rastrear pedido
            </Link>
            <Link href="/asistente" className="transition-colors hover:text-brand-orange">
              Asistente IA
            </Link>
            <Link href="/admin" className="flex items-center gap-1 transition-colors hover:text-brand-orange">
              <LayoutDashboard className="h-3.5 w-3.5" /> Panel administrador
            </Link>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-border bg-card/95 shadow-[0_10px_30px_-26px_rgba(2,44,92,0.75)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <MobileNav activeCategory={activeCategory} allCatalogActive={allCatalogActive} onCategoryChange={setActiveCategory} categories={CATEGORIES} />
          <Logo />

          {/* Smart search */}
          <form
            onSubmit={onSearch}
            className="relative ml-2 hidden flex-1 items-center md:flex"
          >
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca herramientas, marcas o describe tu proyecto..."
              className="h-11 rounded-full border-border pl-10 pr-28"
              aria-label="Buscador inteligente"
            />
            <div className="absolute right-1.5 flex items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-accent"
                aria-label="Buscar por voz"
                onClick={() => router.push("/asistente")}
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-accent"
                aria-label="Buscar por fotografía"
                onClick={() => router.push("/buscar-ia")}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <Button
                type="submit"
                size="icon"
                className="h-8 w-8 rounded-full bg-brand-orange text-brand-navy shadow-sm hover:bg-brand-orange/90"
                aria-label="Buscar"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" className="gap-2 px-2 text-primary" aria-label={`Cuenta de ${user.name}`} />}>
                  <Avatar size="sm"><AvatarFallback className="bg-primary font-bold text-primary-foreground">{initials(user.name)}</AvatarFallback></Avatar>
                  <span className="hidden max-w-28 truncate text-sm font-semibold lg:inline">{user.name.split(" ")[0]}</span>
                  <ChevronDown className="hidden h-3.5 w-3.5 lg:block" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="px-3 py-2"><span className="block truncate font-semibold text-foreground">{user.name}</span><span className="block truncate font-normal">{user.email}</span></DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/mi-cuenta")}><User />Mi cuenta y pedidos</DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={logout}><LogOut />Cerrar sesión</DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="ghost" className="text-primary" aria-label="Mi cuenta">
                <Link href="/mi-cuenta"><User className="h-5 w-5" /><span className="ml-1 hidden text-sm font-medium lg:inline">Ingresar</span></Link>
              </Button>
            )}
            <Button
              asChild
              variant="ghost"
              className="relative text-primary"
            >
              <Link href="/carrito" aria-label="Carrito de compras">
                <ShoppingCart className="h-5 w-5" />
                {count > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-orange px-1 text-xs font-bold text-brand-navy">
                    {count}
                  </span>
                )}
                <span className="ml-1 hidden text-sm font-medium lg:inline">Carrito</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Mobile search */}
        <form onSubmit={onSearch} className="relative px-4 pb-3 md:hidden">
          <Search className="pointer-events-none absolute left-7 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="¿Qué necesitas para tu proyecto?"
            className="h-10 rounded-full pl-10"
          />
        </form>

        {/* Category nav */}
        <nav className="border-t border-border bg-card/90">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2 text-sm">
            <button
              type="button"
              onClick={() => scrollCategories(-1)}
              disabled={!canScrollCategoriesLeft}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm transition-all hover:-translate-x-0.5 hover:border-accent hover:bg-accent/10 hover:text-accent disabled:pointer-events-none disabled:opacity-25"
              aria-label="Ver categorías anteriores"
              title="Categorías anteriores"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div ref={categoryScrollRef} className="category-nav-scroll flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scroll-smooth px-1">
            <Link
              href="/catalogo"
              onClick={() => setActiveCategory(null)}
              data-category="all"
              aria-current={allCatalogActive ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors",
                allCatalogActive ? "bg-brand-orange font-semibold text-brand-navy" : "bg-brand-ice text-primary hover:bg-brand-orange/15",
              )}
            >
              <Sparkles className="h-4 w-4" /> Todo el catálogo
            </Link>
            <Link href="/promociones" className="shrink-0 whitespace-nowrap rounded-md bg-rose-50 px-3 py-1.5 font-semibold text-rose-700 hover:bg-rose-100">Promociones y Outlet</Link>
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/catalogo?categoria=${c.slug}`}
                onClick={() => setActiveCategory(c.slug)}
                data-category={c.slug}
                aria-current={activeCategory === c.slug ? "page" : undefined}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 transition-colors",
                  activeCategory === c.slug
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-primary",
                )}
              >
                {c.name}
              </Link>
            ))}
            </div>
            <button
              type="button"
              onClick={() => scrollCategories(1)}
              disabled={!canScrollCategoriesRight}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm transition-all hover:translate-x-0.5 hover:border-accent hover:bg-accent/10 hover:text-accent disabled:pointer-events-none disabled:opacity-25"
              aria-label="Ver más categorías"
              title="Más categorías"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </nav>
      </div>
    </header>
  )
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
}

function MobileNav({ activeCategory, allCatalogActive, onCategoryChange, categories }: { activeCategory: string | null; allCatalogActive: boolean; onCategoryChange: (category: string | null) => void; categories: CategoryRecord[] }) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menú" />
        }
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle className="text-primary">Categorías</SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex flex-col gap-1 px-4 pb-6">
          <Link href="/catalogo" onClick={() => onCategoryChange(null)} aria-current={allCatalogActive ? "page" : undefined} className={cn("rounded-md px-3 py-2 font-medium", allCatalogActive ? "bg-accent text-accent-foreground" : "text-accent")}>
            Todo el catálogo
          </Link>
          <Link href="/promociones" className="rounded-md px-3 py-2 font-semibold text-rose-700 hover:bg-rose-50">Promociones y Outlet</Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/catalogo?categoria=${c.slug}`}
              onClick={() => onCategoryChange(c.slug)}
              aria-current={activeCategory === c.slug ? "page" : undefined}
              className={cn("rounded-md px-3 py-2 text-sm", activeCategory === c.slug ? "bg-primary font-semibold text-primary-foreground" : "text-foreground hover:bg-secondary")}
            >
              {c.name}
            </Link>
          ))}
          <div className="my-2 h-px bg-border" />
          <Link href="/asistente" className="rounded-md px-3 py-2 text-sm hover:bg-secondary">
            Asistente IA
          </Link>
          <Link href="/buscar-ia" className="rounded-md px-3 py-2 text-sm hover:bg-secondary">
            Buscar por foto
          </Link>
          <Link href="/rastrear-pedido" className="rounded-md px-3 py-2 text-sm hover:bg-secondary">
            Rastrear pedido
          </Link>
          <Link href="/mi-cuenta" className="rounded-md px-3 py-2 text-sm hover:bg-secondary">
            Mi cuenta
          </Link>
          <Link href="/admin" className="rounded-md px-3 py-2 text-sm hover:bg-secondary">
            Panel administrador
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
