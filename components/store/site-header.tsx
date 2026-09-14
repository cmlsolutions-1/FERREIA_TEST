"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
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
  LogOut,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
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
import { CATEGORIES, COMPANY } from "@/lib/data"
import { cn } from "@/lib/utils"

function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground font-bold">
        F
      </span>
      <span className="text-xl font-bold tracking-tight text-primary">
        FERRE<span className="text-accent">IA</span>
      </span>
    </Link>
  )
}

export function SiteHeader() {
  const router = useRouter()
  const { count } = useCart()
  const { user, logout } = useCustomerSession()
  const [query, setQuery] = useState("")

  function onSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(`/catalogo${query ? `?q=${encodeURIComponent(query)}` : ""}`)
  }

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top utility bar */}
      <div className="hidden bg-primary text-primary-foreground md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-accent" /> {COMPANY.phone}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-accent" /> Envíos a toda Colombia
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/rastrear-pedido" className="flex items-center gap-1 hover:text-accent">
              <PackageSearch className="h-3.5 w-3.5" /> Rastrear pedido
            </Link>
            <Link href="/asistente" className="hover:text-accent">
              Asistente IA
            </Link>
            <Link href="/admin" className="flex items-center gap-1 hover:text-accent">
              <LayoutDashboard className="h-3.5 w-3.5" /> Panel administrador
            </Link>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <MobileNav />
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
                className="h-8 w-8 rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
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
                  <DropdownMenuLabel className="px-3 py-2"><span className="block truncate font-semibold text-foreground">{user.name}</span><span className="block truncate font-normal">{user.email}</span></DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/mi-cuenta")}><User />Mi cuenta y pedidos</DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={logout}><LogOut />Cerrar sesión</DropdownMenuItem>
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
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-semibold text-accent-foreground">
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
        <nav className="border-t border-border bg-background">
          <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 text-sm">
            <Link
              href="/catalogo"
              className="flex shrink-0 items-center gap-1.5 rounded-md bg-accent/10 px-3 py-1.5 font-medium text-accent"
            >
              <Sparkles className="h-4 w-4" /> Todo el catálogo
            </Link>
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/catalogo?categoria=${c.slug}`}
                className="shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  )
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
}

function MobileNav() {
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
          <Link href="/catalogo" className="rounded-md px-3 py-2 font-medium text-accent">
            Todo el catálogo
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/catalogo?categoria=${c.slug}`}
              className="rounded-md px-3 py-2 text-sm text-foreground hover:bg-secondary"
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
