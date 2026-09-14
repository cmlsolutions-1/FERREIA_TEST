"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { LayoutGrid, List, SlidersHorizontal, X, Scale } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProductCard, RatingStars } from "@/components/store/product-card"
import { useCart } from "@/components/cart-provider"
import { useLiveInventoryStock } from "@/components/use-live-stock"
import { CATEGORIES, PRODUCTS, BRANDS, formatCOP, type Product } from "@/lib/data"
import { cn } from "@/lib/utils"

type Props = { initialCategory?: string; initialQuery?: string }

const AVAILABILITY = ["En stock", "Bajo pedido"]

export function CatalogView({ initialCategory, initialQuery }: Props) {
  const [categories, setCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : [],
  )
  const [brands, setBrands] = useState<string[]>([])
  const [maxPrice, setMaxPrice] = useState(500000)
  const [onlyStock, setOnlyStock] = useState(false)
  const [sort, setSort] = useState("relevancia")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [compare, setCompare] = useState<Product[]>([])
  const stockBySku = useLiveInventoryStock()
  const query = (initialQuery ?? "").toLowerCase()

  const products = useMemo(
    () => PRODUCTS.map((product) => ({
      ...product,
      stock: stockBySku[product.sku] ?? product.stock,
    })),
    [stockBySku],
  )
  const comparedProducts = useMemo(
    () => compare.map((selected) => products.find((product) => product.id === selected.id) ?? selected),
    [compare, products],
  )

  function toggle(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value])
  }

  function toggleCompare(p: Product) {
    setCompare((prev) =>
      prev.find((x) => x.id === p.id)
        ? prev.filter((x) => x.id !== p.id)
        : prev.length < 4
          ? [...prev, p]
          : prev,
    )
  }

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (categories.length && !categories.includes(p.category)) return false
      if (brands.length && !brands.includes(p.brand)) return false
      if (p.price > maxPrice) return false
      if (onlyStock && p.stock <= 0) return false
      if (query && !`${p.name} ${p.brand} ${p.subcategory}`.toLowerCase().includes(query))
        return false
      return true
    })
    if (sort === "precio-asc") list = [...list].sort((a, b) => a.price - b.price)
    if (sort === "precio-desc") list = [...list].sort((a, b) => b.price - a.price)
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating)
    return list
  }, [categories, brands, maxPrice, onlyStock, sort, query, products])

  const filters = (
    <div className="space-y-6">
      <FilterGroup title="Categoría">
        {CATEGORIES.map((c) => (
          <label key={c.slug} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={categories.includes(c.slug)}
              onCheckedChange={() => toggle(categories, setCategories, c.slug)}
            />
            <span className="flex-1">{c.name}</span>
            <span className="text-xs text-muted-foreground">{c.count}</span>
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Marca">
        {BRANDS.map((b) => (
          <label key={b} className="flex items-center gap-2 text-sm">
            <Checkbox checked={brands.includes(b)} onCheckedChange={() => toggle(brands, setBrands, b)} />
            {b}
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Precio máximo">
        <input
          type="range"
          min={10000}
          max={500000}
          step={10000}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[var(--accent)]"
        />
        <p className="text-sm text-muted-foreground">Hasta {formatCOP(maxPrice)}</p>
      </FilterGroup>

      <FilterGroup title="Disponibilidad">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={onlyStock} onCheckedChange={(v) => setOnlyStock(Boolean(v))} />
          Solo productos en stock
        </label>
      </FilterGroup>

      <FilterGroup title="Atributos">
        <p className="text-xs text-muted-foreground">
          Potencia, tamaño y material disponibles en la ficha de cada producto.
        </p>
      </FilterGroup>
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Catálogo</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} productos {query && `para "${initialQuery}"`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={(value) => value && setSort(value)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevancia">Relevancia</SelectItem>
              <SelectItem value="precio-asc">Menor precio</SelectItem>
              <SelectItem value="precio-desc">Mayor precio</SelectItem>
              <SelectItem value="rating">Mejor calificados</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex rounded-md border border-border">
            <Button
              variant="ghost"
              size="icon"
              className={cn("rounded-r-none", view === "grid" && "bg-secondary text-accent")}
              onClick={() => setView("grid")}
              aria-label="Vista cuadrícula"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("rounded-l-none", view === "list" && "bg-secondary text-accent")}
              onClick={() => setView("list")}
              aria-label="Vista lista"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="hidden rounded-xl border border-border bg-card p-5 lg:block">
          <div className="mb-4 flex items-center gap-2 font-semibold text-primary">
            <SlidersHorizontal className="h-4 w-4" /> Filtros
          </div>
          {filters}
        </aside>

        <div>
          {view === "grid" ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((p) => (
                <ListRow key={p.id} product={p} onCompare={toggleCompare} comparing={!!compare.find((x) => x.id === p.id)} />
              ))}
            </div>
          )}
          {filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
              No se encontraron productos con los filtros seleccionados.
            </div>
          )}
        </div>
      </div>

      {compare.length > 0 && <CompareBar items={comparedProducts} onClear={() => setCompare([])} onRemove={(id) => setCompare((p) => p.filter((x) => x.id !== id))} />}
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-primary">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function ListRow({
  product,
  onCompare,
  comparing,
}: {
  product: Product
  onCompare: (p: Product) => void
  comparing: boolean
}) {
  const { addItem } = useCart()
  return (
    <div className="flex gap-4 rounded-xl border border-border bg-card p-3">
      <Link href={`/producto/${product.id}`} className="shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          className="h-28 w-28 rounded-lg object-cover"
        />
      </Link>
      <div className="flex flex-1 flex-col">
        <p className="text-xs font-medium uppercase text-accent">{product.brand}</p>
        <Link href={`/producto/${product.id}`} className="font-medium text-foreground hover:text-accent">
          {product.name}
        </Link>
        <div className="mt-1 flex items-center gap-1.5">
          <RatingStars rating={product.rating} />
          <span className="text-xs text-muted-foreground">({product.reviews})</span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        <div className="mt-auto flex items-center gap-3 pt-2">
          <div>
            <span className="text-lg font-bold text-primary">{formatCOP(product.price)}</span>
            <p className="text-xs font-medium text-accent">
              Inner x{product.priceTiers.inner.quantity}: {formatCOP(product.priceTiers.inner.unitPrice)} / und · Master x{product.priceTiers.master.quantity}: {formatCOP(product.priceTiers.master.unitPrice)} / und
            </p>
          </div>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => addItem(product)}
            disabled={product.stock <= 0}
          >
            {product.stock > 0 ? "Agregar" : "Agotado"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={cn("gap-1.5 bg-transparent", comparing && "border-accent text-accent")}
            onClick={() => onCompare(product)}
          >
            <Scale className="h-4 w-4" /> Comparar
          </Button>
        </div>
      </div>
    </div>
  )
}

function CompareBar({
  items,
  onClear,
  onRemove,
}: {
  items: Product[]
  onClear: () => void
  onRemove: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-border bg-card px-4 py-2 shadow-xl">
        <Scale className="h-5 w-5 text-accent" />
        <span className="text-sm font-medium">Comparar {items.length}</span>
        <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setOpen(true)}>
          Ver comparación
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClear} aria-label="Limpiar">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="max-h-[85vh] w-full max-w-4xl overflow-auto rounded-2xl bg-background p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary">Comparador de productos</h2>
              <Button size="icon" variant="ghost" onClick={() => setOpen(false)} aria-label="Cerrar">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="w-32 p-2 text-left text-muted-foreground"></th>
                    {items.map((p) => (
                      <th key={p.id} className="min-w-40 p-2 text-left align-top">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.image || "/placeholder.svg"} alt={p.name} className="mb-2 h-24 w-24 rounded-lg object-cover" />
                        <p className="font-semibold text-foreground">{p.name}</p>
                        <button onClick={() => onRemove(p.id)} className="mt-1 text-xs text-destructive hover:underline">
                          Quitar
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <CompareRow label="Marca" values={items.map((p) => p.brand)} />
                  <CompareRow label="Precio unidad" values={items.map((p) => formatCOP(p.price))} />
                  <CompareRow label="Caja inner" values={items.map((p) => `${p.priceTiers.inner.quantity} und · ${formatCOP(p.priceTiers.inner.unitPrice)} / und`)} />
                  <CompareRow label="Caja master" values={items.map((p) => `${p.priceTiers.master.quantity} und · ${formatCOP(p.priceTiers.master.unitPrice)} / und`)} />
                  <CompareRow label="Calificación" values={items.map((p) => `${p.rating} ★ (${p.reviews})`)} />
                  <CompareRow label="Stock" values={items.map((p) => `${p.stock} und`)} />
                  <CompareRow label="Potencia" values={items.map((p) => p.power ?? "—")} />
                  <CompareRow label="Tamaño" values={items.map((p) => p.size ?? "—")} />
                  <CompareRow label="Material" values={items.map((p) => p.material ?? "—")} />
                  <CompareRow label="SKU" values={items.map((p) => p.sku)} />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function CompareRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr className="border-t border-border">
      <td className="p-2 font-medium text-muted-foreground">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="p-2 text-foreground">
          {v}
        </td>
      ))}
    </tr>
  )
}
