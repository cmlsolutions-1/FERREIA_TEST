"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  ChevronDown,
  Boxes,
  PackagePlus,
  ShoppingCart,
  Receipt,
  Users,
  PackageCheck,
  PackageSearch,
  BarChart3,
  Settings,
  Store,
  Menu,
  X,
} from "lucide-react"

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/articulos", label: "Catálogo de artículos", icon: PackagePlus },
  { href: "/admin/inventario", label: "Inventario", icon: Boxes },
  { href: "/admin/compras", label: "Compras", icon: ShoppingCart },
  { href: "/admin/ventas", label: "Ventas", icon: Receipt },
  { href: "/admin/pedidos", label: "Pedidos", icon: PackageCheck },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/proveedores", label: "Proveedores", icon: PackageSearch },
  { href: "/admin/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
]

const INVENTORY_OPERATIONS = [
  { href: "/admin/inventario/nota-inventarios", label: "Nota de inventarios" },
  { href: "/admin/inventario/traslado-bodegas", label: "Traslado entre bodegas" },
  { href: "/admin/inventario/orden-traslado-bodegas", label: "Orden de traslado entre bodegas" },
  { href: "/admin/inventario/traslado-variantes", label: "Traslado entre variantes" },
  { href: "/admin/inventario/orden-produccion", label: "Orden de producción" },
  { href: "/admin/inventario/salidas", label: "Salida de inventarios" },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [inventoryOpen, setInventoryOpen] = useState(pathname.startsWith("/admin/inventario"))

  return (
    <>
      <div className="flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-3 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2 font-bold text-sidebar-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            F
          </span>
          FERREIA ERP
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen((v) => !v)}
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="sr-only">Menú</span>
        </Button>
      </div>

      <aside
        className={cn(
          "flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:sticky lg:top-0 lg:h-screen",
          open ? "block" : "hidden lg:flex",
        )}
      >
        <div className="hidden items-center gap-2 border-b border-sidebar-border px-5 py-4 lg:flex">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-base font-bold text-sidebar-primary-foreground">
            F
          </span>
          <div className="leading-tight">
            <p className="font-bold text-sidebar-foreground">FERREIA</p>
            <p className="text-xs text-sidebar-foreground/60">Panel administrativo</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href === "/admin/inventario" && pathname.startsWith("/admin/inventario/"))
            const Icon = item.icon
            if (item.href === "/admin/inventario") return (
              <div key={item.href}>
                <button type="button" onClick={() => setInventoryOpen((value) => !value)} className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
                  <Icon className="h-4 w-4 shrink-0" /><span className="flex-1 text-left">{item.label}</span><ChevronDown className={cn("h-4 w-4 transition-transform", inventoryOpen && "rotate-180")} />
                </button>
                {inventoryOpen && <div className="ml-3 mt-1 space-y-0.5 border-l border-sidebar-border py-1 pl-2">
                  <Link href="/admin/inventario" onClick={() => setOpen(false)} className={cn("flex items-center gap-2 rounded-md px-2 py-2 text-xs transition-colors", pathname === "/admin/inventario" ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground" : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}><span className={cn("h-1.5 w-1.5 rounded-full", pathname === "/admin/inventario" ? "bg-sidebar-primary" : "bg-sidebar-foreground/25")} />Existencias</Link>
                  <p className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40">Operaciones de inventario</p>
                  {INVENTORY_OPERATIONS.map((operation) => { const moduleActive = pathname === operation.href; return <Link key={operation.href} href={operation.href} onClick={() => setOpen(false)} className={cn("flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] leading-4 transition-colors", moduleActive ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground" : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}><span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", moduleActive ? "bg-sidebar-primary" : "bg-sidebar-foreground/25")} />{operation.label}</Link> })}
                </div>}
              </div>
            )
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Store className="h-4 w-4 shrink-0" />
            Ir a la tienda
          </Link>
        </div>
      </aside>
    </>
  )
}
