"use client"

import { useEffect, useMemo, useState } from "react"
import { BadgePercent, CalendarDays, Check, Package, Search, Tag, Trash2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCOP } from "@/lib/data"
import { type ProductMaster } from "@/lib/product-master"
import { PRODUCT_UPDATED_EVENT } from "@/lib/cost-pricing"
import { discountPercent, promotionStatus, PROMOTIONS_UPDATED_EVENT, type Promotion, type PromotionKind } from "@/lib/promotions"
import { getAllProducts, type ProductRecord } from "@/services/products.service"
import { getPromotions, savePromotion, removePromotion } from "@/services/promotions.service"

function toMaster(product: ProductRecord): ProductMaster { return { id: product.sku, reference: product.reference, supplierReference: product.supplierReference, name: product.name, sku: product.sku, barcodes: product.barcodes, line: product.line, brand: product.brand, group: product.group, subgroup: product.subgroup, packaging: product.packaging, unit: product.unit, weight: product.weight, cost: product.cost, price: product.basePrice, taxRate: product.taxRate, warehouse: product.warehouse, stock: product.stock, stockMin: product.stockMin, stockMax: product.stockMax, images: product.images, suppliers: product.suppliers, characteristics: product.characteristics, active: product.active, markupPercent: product.markupPercent, costReview: product.costReview } }

export function PromotionsView() {
  const [products, setProducts] = useState<ProductMaster[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [draft, setDraft] = useState<Promotion | null>(null)
  const [pickerReset, setPickerReset] = useState(0)
  const [query, setQuery] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    const loadProducts = () => { getAllProducts({ admin: true }).then((items) => setProducts(items.map(toMaster))).catch(() => {}) }
    const loadPromotions = () => { getPromotions().then((result) => setPromotions(result.data)).catch(() => {}) }
    loadProducts(); loadPromotions()
    window.addEventListener(PRODUCT_UPDATED_EVENT, loadProducts)
    window.addEventListener(PROMOTIONS_UPDATED_EVENT, loadPromotions)
    window.addEventListener("storage", loadProducts)
    window.addEventListener("storage", loadPromotions)
    return () => { window.removeEventListener(PRODUCT_UPDATED_EVENT, loadProducts); window.removeEventListener(PROMOTIONS_UPDATED_EVENT, loadPromotions); window.removeEventListener("storage", loadProducts); window.removeEventListener("storage", loadPromotions) }
  }, [])

  const storefrontProducts = products
  const productBySku = useMemo(() => Object.fromEntries(storefrontProducts.map((product) => [product.sku, product])) as Record<string, ProductMaster>, [storefrontProducts])
  const filtered = promotions.filter((promotion) => {
    const product = productBySku[promotion.sku]
    return product && `${product.name} ${product.sku} ${promotion.kind}`.toLowerCase().includes(query.toLowerCase())
  })
  const activeCount = promotions.filter((promotion) => productBySku[promotion.sku] && promotionStatus(promotion, productBySku[promotion.sku].price) === "vigente").length
  const reviewCount = promotions.filter((promotion) => productBySku[promotion.sku] && promotionStatus(promotion, productBySku[promotion.sku].price) === "revisar").length


  function chooseProduct(sku: string) {
    const product = productBySku[sku]
    if (!product) return
    const existing = promotions.find((item) => item.sku === sku)
    setDraft(existing ? { ...existing } : { sku, kind: "promocion", regularPrice: product.price, salePrice: Math.round(product.price * 0.9), basePrice: product.price, startsAt: "", endsAt: "", active: true, updatedAt: "" })
    setError("")
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (!draft) return
    const product = productBySku[draft.sku]
    if (!product || !product.active) { setError("Selecciona un artículo activo de la tienda."); return }
    if (!Number.isFinite(draft.regularPrice) || !Number.isFinite(draft.salePrice) || draft.regularPrice <= 0 || draft.salePrice <= 0 || draft.salePrice >= draft.regularPrice) { setError("El precio promocional debe ser mayor que cero y menor que el precio anterior."); return }
    if (draft.startsAt && draft.endsAt && draft.endsAt < draft.startsAt) { setError("La fecha final debe ser posterior a la inicial."); return }
    try { const result = await savePromotion(draft); setPromotions([...promotions.filter((item) => item.sku !== draft.sku), result.data]); setDraft(null); setError(""); setPickerReset((value) => value + 1); window.dispatchEvent(new Event(PROMOTIONS_UPDATED_EVENT)) }
    catch (failure) { setError(failure instanceof Error ? failure.message : "No fue posible guardar el descuento") }
  }

  async function remove(sku: string) {
    try { await removePromotion(sku); setPromotions(promotions.filter((item) => item.sku !== sku)); if (draft?.sku === sku) { setDraft(null); setPickerReset((value) => value + 1) }; window.dispatchEvent(new Event(PROMOTIONS_UPDATED_EVENT)) }
    catch (failure) { setError(failure instanceof Error ? failure.message : "No fue posible eliminar el descuento") }
  }

  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h1 className="text-2xl font-bold">Promociones y outlet</h1><Badge variant="outline">PostgreSQL</Badge></div><p className="mt-1 text-sm text-muted-foreground">Controla los descuentos que se publican en la tienda. Los cambios también actualizan el carrito.</p></div><Button asChild variant="outline"><a href="/promociones">Ver en la tienda</a></Button></div>
    <div className="grid gap-3 sm:grid-cols-3"><Metric icon={Tag} title="Promociones vigentes" value={activeCount} /><Metric icon={CalendarDays} title="Por revisar" value={reviewCount} /><Metric icon={BadgePercent} title="Artículos de la tienda" value={storefrontProducts.length} /></div>
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <Card className="h-fit"><CardContent className="space-y-4 p-5"><div><h2 className="font-bold">{draft && promotions.some((item) => item.sku === draft.sku) ? "Editar descuento" : "Crear descuento"}</h2><p className="text-xs text-muted-foreground">El precio anterior y el descuento se reflejan en las fichas de la tienda.</p></div><form onSubmit={save} className="space-y-4"><ProductSearchPicker products={storefrontProducts.filter((item) => item.active)} promotions={promotions} selected={draft ? productBySku[draft.sku] : undefined} resetKey={pickerReset} onSelect={chooseProduct} onClear={() => { setDraft(null); setError("") }} />{draft && <><Field label="Tipo"><Select value={draft.kind} onValueChange={(value) => value && setDraft({ ...draft, kind: value as PromotionKind })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="promocion">Promoción</SelectItem><SelectItem value="outlet">Outlet</SelectItem></SelectContent></Select></Field><div className="grid grid-cols-2 gap-3"><Field label="Precio anterior"><Input type="number" min="1" step="1" value={draft.regularPrice} onChange={(event) => setDraft({ ...draft, regularPrice: Number(event.target.value) })} /></Field><Field label="Precio con descuento"><Input type="number" min="1" step="1" value={draft.salePrice} onChange={(event) => setDraft({ ...draft, salePrice: Number(event.target.value) })} /></Field></div><Field label="Porcentaje de descuento"><Input type="number" min="1" max="99" step="1" value={draft.regularPrice > 0 ? discountPercent(draft) : 0} onChange={(event) => setDraft({ ...draft, salePrice: Math.round(draft.regularPrice * (1 - Number(event.target.value) / 100)) })} /></Field><div className="grid grid-cols-2 gap-3"><Field label="Inicia (opcional)"><Input type="date" value={draft.startsAt} onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })} /></Field><Field label="Termina (opcional)"><Input type="date" value={draft.endsAt} onChange={(event) => setDraft({ ...draft, endsAt: event.target.value })} /></Field></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} />Publicar descuento</label><div className="rounded-lg bg-muted p-3 text-sm"><p>Descuento: <b>{draft.regularPrice > draft.salePrice && draft.salePrice > 0 ? `${discountPercent(draft)}%` : "—"}</b></p><p>Precio base del artículo: <b>{formatCOP(productBySku[draft.sku]?.price ?? 0)}</b></p>{draft.salePrice < (productBySku[draft.sku]?.cost ?? 0) && <p className="mt-1 font-medium text-amber-700">El precio rebajado está por debajo del costo.</p>}</div></>}{error && <p className="rounded-lg bg-rose-50 p-2 text-sm text-rose-700">{error}</p>}<Button type="submit" disabled={!draft} className="w-full">Guardar descuento</Button>{draft && <Button type="button" variant="ghost" className="w-full" onClick={() => { setDraft(null); setError(""); setPickerReset((value) => value + 1) }}>Cancelar</Button>}</form></CardContent></Card>
      <Card><CardContent className="p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">Descuentos registrados</h2><p className="text-xs text-muted-foreground">Si cambia el precio base del artículo, la oferta queda pendiente de revisión.</p></div><div className="relative w-full sm:w-64"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar artículo" className="pl-9" /></div></div><div className="space-y-3">{filtered.length === 0 && <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No hay descuentos para esta búsqueda.</p>}{filtered.map((promotion) => { const product = productBySku[promotion.sku]; const status = promotionStatus(promotion, product.price); return <div key={promotion.sku} className="flex flex-wrap items-center gap-3 rounded-xl border p-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{product.name}</p><Badge variant="outline">{promotion.kind === "outlet" ? "Outlet" : "Promoción"}</Badge><Badge className={status === "vigente" ? "bg-emerald-50 text-emerald-700" : status === "revisar" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"}>{status}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{product.sku} · Actualizado: {promotion.updatedAt ? new Date(promotion.updatedAt).toLocaleString("es-CO") : "Datos iniciales"}</p><p className="mt-2 text-sm"><span className="text-muted-foreground line-through">{formatCOP(promotion.regularPrice)}</span> <b className="text-emerald-700">{formatCOP(promotion.salePrice)}</b> <span className="font-semibold text-rose-700">−{discountPercent(promotion)}%</span></p>{status === "revisar" && <p className="mt-1 text-xs text-amber-800">El precio base cambió a {formatCOP(product.price)}. Revisa y guarda nuevamente antes de publicarla.</p>}</div><div className="flex gap-1"><Button variant="outline" size="sm" onClick={() => chooseProduct(promotion.sku)}>Editar</Button><Button variant="ghost" size="icon" aria-label={`Quitar descuento de ${product.name}`} onClick={() => remove(promotion.sku)}><Trash2 className="h-4 w-4" /></Button></div></div> })}</div></CardContent></Card>
    </div>
  </div>
}

function Metric({ icon: Icon, title, value }: { icon: typeof Tag; title: string; value: number }) { return <Card><CardContent className="flex items-center gap-3 p-4"><Icon className="h-5 w-5 text-accent" /><div><p className="text-xs text-muted-foreground">{title}</p><p className="text-xl font-bold">{value}</p></div></CardContent></Card> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}</div> }

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
}

function ProductSearchPicker({ products, promotions, selected, resetKey, onSelect, onClear }: { products: ProductMaster[]; promotions: Promotion[]; selected?: ProductMaster; resetKey: number; onSelect: (sku: string) => void; onClear: () => void }) {
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)

  useEffect(() => { if (selected) { setSearch(selected.name); setOpen(false); setHighlighted(-1) } }, [selected?.sku, selected?.name])
  useEffect(() => { if (resetKey > 0) { setSearch(""); setOpen(false); setHighlighted(-1) } }, [resetKey])

  const normalizedQuery = normalizeSearch(search)
  const matches = useMemo(() => {
    if (normalizedQuery.length < 2) return []
    const terms = normalizedQuery.split(/\s+/).filter(Boolean)
    return products.filter((product) => {
      const text = normalizeSearch([product.name, product.sku, product.reference, product.brand, ...product.barcodes.map((barcode) => barcode.code)].join(" "))
      return terms.every((term) => text.includes(term))
    }).sort((a, b) => {
      const score = (product: ProductMaster) => {
        const sku = normalizeSearch(product.sku)
        const name = normalizeSearch(product.name)
        return sku === normalizedQuery ? 0 : sku.startsWith(normalizedQuery) ? 1 : name.startsWith(normalizedQuery) ? 2 : 3
      }
      return score(a) - score(b) || a.name.localeCompare(b.name, "es")
    })
  }, [products, normalizedQuery])
  const results = matches.slice(0, 8)

  function pick(sku: string) {
    onSelect(sku)
    setOpen(false)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") { setOpen(false); return }
    if (!open || !results.length) return
    if (event.key === "ArrowDown") { event.preventDefault(); setHighlighted((index) => (index + 1) % results.length) }
    if (event.key === "ArrowUp") { event.preventDefault(); setHighlighted((index) => index < 0 ? results.length - 1 : (index - 1 + results.length) % results.length) }
    if (event.key === "Enter") { event.preventDefault(); pick(results[highlighted]?.sku ?? results[0].sku) }
  }

  return <div className="space-y-2" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
    <Label htmlFor="promotion-product-search">Buscar artículo</Label>
    <div className="relative"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="promotion-product-search" role="combobox" aria-autocomplete="list" aria-expanded={open && normalizeSearch(search).length >= 2} aria-controls="promotion-product-results" aria-activedescendant={open && highlighted >= 0 && results.length ? `promotion-option-${results[highlighted]?.sku}` : undefined} autoComplete="off" value={search} onChange={(event) => { if (selected) onClear(); setSearch(event.target.value); setOpen(true); setHighlighted(-1) }} onFocus={() => setOpen(true)} onKeyDown={onKeyDown} placeholder="Nombre, SKU, referencia o código de barras" className="pl-9 pr-9" />{search && <button type="button" aria-label="Limpiar búsqueda de artículo" className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => { setSearch(""); setOpen(true); setHighlighted(-1); onClear() }}><X className="h-4 w-4" /></button>}</div>
    {open && normalizeSearch(search).length >= 2 && <div id="promotion-product-results" role="listbox" aria-label="Resultados de artículos" className="max-h-72 overflow-y-auto rounded-lg border bg-card p-1 shadow-lg">{results.length ? results.map((product, index) => <button key={product.sku} id={`promotion-option-${product.sku}`} role="option" aria-selected={highlighted === index} type="button" onMouseEnter={() => setHighlighted(index)} onClick={() => pick(product.sku)} className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm ${highlighted === index ? "bg-accent/10" : "hover:bg-muted"}`}><Package className="h-5 w-5 shrink-0 text-accent" /><span className="min-w-0 flex-1"><span className="block truncate font-medium">{product.name}</span><span className="block text-xs text-muted-foreground">Ref. {product.reference} · SKU {product.sku} · {product.brand || "Sin marca"} · {formatCOP(product.price)}</span></span>{promotions.some((item) => item.sku === product.sku) && <Badge variant="outline" className="shrink-0 text-[10px]">Con descuento</Badge>}{selected?.sku === product.sku && <Check className="h-4 w-4 shrink-0 text-emerald-700" />}</button>) : <p className="px-3 py-4 text-sm text-muted-foreground">No encontramos artículos. Prueba con el SKU o parte del nombre.</p>}{matches.length > 8 && <p className="border-t px-3 py-2 text-xs text-muted-foreground">Mostrando 8 de {matches.length} resultados. Escribe más para precisar la búsqueda.</p>}</div>}
    {open && normalizeSearch(search).length < 2 && <p className="text-xs text-muted-foreground">Escribe al menos 2 caracteres para buscar entre {products.length} artículos.</p>}
    {selected && <div className="flex items-center gap-3 rounded-lg border border-accent/30 bg-accent/5 p-3"><Package className="h-5 w-5 shrink-0 text-accent" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{selected.name}</p><p className="text-xs text-muted-foreground">Ref. {selected.reference} · SKU {selected.sku} · Precio base {formatCOP(selected.price)}</p></div><Check className="h-4 w-4 shrink-0 text-emerald-700" /></div>}
  </div>
}
