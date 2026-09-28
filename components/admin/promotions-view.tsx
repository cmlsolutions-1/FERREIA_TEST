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
import { promotionStatus, PROMOTIONS_UPDATED_EVENT, type Promotion, type PromotionKind, type PromotionTierKey } from "@/lib/promotions"
import { getAllProducts, type ProductRecord } from "@/services/products.service"
import { getPromotions, savePromotion, removePromotion } from "@/services/promotions.service"

function toMaster(product: ProductRecord): ProductMaster { return { id: product.sku, reference: product.reference, supplierReference: product.supplierReference, name: product.name, sku: product.sku, barcodes: product.barcodes, line: product.line, brand: product.brand, group: product.group, subgroup: product.subgroup, packaging: product.packaging, priceTiers: product.basePriceTiers ?? product.priceTiers, unit: product.unit, weight: product.weight, cost: product.cost, price: product.basePrice, taxRate: product.taxRate, warehouse: product.warehouse, stock: product.stock, stockMin: product.stockMin, stockMax: product.stockMax, images: product.images, suppliers: product.suppliers, characteristics: product.characteristics, active: product.active, markupPercent: product.markupPercent, costReview: product.costReview } }
const tierKeys: PromotionTierKey[] = ["unit", "inner", "master"]
const tierNames: Record<PromotionTierKey, string> = { unit: "Unidad", inner: "Inner", master: "Master" }
const discounted = (price: number, percent: number) => Math.round(price * (1 - percent / 100) * 100) / 100
function configuredPromotion(product: ProductMaster, existing?: Promotion): Promotion {
  const basePrices = { unit: product.priceTiers.unit.unitPrice, inner: product.priceTiers.inner.unitPrice, master: product.priceTiers.master.unitPrice }
  const tiers = Object.fromEntries(tierKeys.map((key) => {
    const enabled = existing?.tiers[key].enabled ?? key === "unit"
    const percent = existing?.tiers[key].percent ?? (key === "unit" ? 10 : 0)
    return [key, { enabled, percent, regularPrice: basePrices[key], salePrice: enabled ? discounted(basePrices[key], percent) : basePrices[key] }]
  })) as Promotion["tiers"]
  return { sku: product.sku, kind: existing?.kind ?? "promocion", regularPrice: basePrices.unit, salePrice: tiers.unit.salePrice, basePrice: basePrices.unit, basePrices, tiers, startsAt: existing?.startsAt ?? "", endsAt: existing?.endsAt ?? "", active: existing?.active ?? true, updatedAt: existing?.updatedAt ?? "" }
}

export function PromotionsView() {
  const [products, setProducts] = useState<ProductMaster[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [draft, setDraft] = useState<Promotion | null>(null)
  const [pickerReset, setPickerReset] = useState(0)
  const [query, setQuery] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    const loadProducts = () => { getAllProducts({ admin: true }).then((items) => setProducts(items.map(toMaster))).catch((failure) => setError(failure instanceof Error ? failure.message : "No fue posible cargar los artículos")) }
    const loadPromotions = () => { getPromotions().then((result) => setPromotions(result.data)).catch((failure) => setError(failure instanceof Error ? failure.message : "No fue posible cargar las promociones")) }
    loadProducts(); loadPromotions()
    window.addEventListener(PRODUCT_UPDATED_EVENT, loadProducts)
    window.addEventListener(PROMOTIONS_UPDATED_EVENT, loadPromotions)
    return () => { window.removeEventListener(PRODUCT_UPDATED_EVENT, loadProducts); window.removeEventListener(PROMOTIONS_UPDATED_EVENT, loadPromotions) }
  }, [])

  const storefrontProducts = products
  const productBySku = useMemo(() => Object.fromEntries(storefrontProducts.map((product) => [product.sku, product])) as Record<string, ProductMaster>, [storefrontProducts])
  const filtered = promotions.filter((promotion) => {
    const product = productBySku[promotion.sku]
    return product && `${product.name} ${product.sku} ${promotion.kind}`.toLowerCase().includes(query.toLowerCase())
  })
  const activeCount = promotions.filter((promotion) => productBySku[promotion.sku] && promotionStatus(promotion, productBySku[promotion.sku].priceTiers) === "vigente").length
  const reviewCount = promotions.filter((promotion) => productBySku[promotion.sku] && promotionStatus(promotion, productBySku[promotion.sku].priceTiers) === "revisar").length


  function chooseProduct(sku: string) {
    const product = productBySku[sku]
    if (!product) return
    const existing = promotions.find((item) => item.sku === sku)
    setDraft(configuredPromotion(product, existing))
    setError("")
  }

  function updateTier(key: PromotionTierKey, values: Partial<Pick<Promotion["tiers"][PromotionTierKey], "enabled" | "percent">>) {
    if (!draft) return
    const product = productBySku[draft.sku]
    if (!product) return
    const regularPrice = product.priceTiers[key].unitPrice
    const tier = { ...draft.tiers[key], ...values, regularPrice }
    tier.salePrice = tier.enabled ? discounted(regularPrice, tier.percent) : regularPrice
    const tiers = { ...draft.tiers, [key]: tier }
    setDraft({ ...draft, tiers, regularPrice: product.price, salePrice: tiers.unit.salePrice, basePrice: product.price, basePrices: { unit: product.priceTiers.unit.unitPrice, inner: product.priceTiers.inner.unitPrice, master: product.priceTiers.master.unitPrice } })
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (!draft) return
    const product = productBySku[draft.sku]
    if (!product || !product.active) { setError("Selecciona un artículo activo de la tienda."); return }
    if (!tierKeys.some((key) => draft.tiers[key].enabled)) { setError("Selecciona al menos una presentación para aplicar el descuento."); return }
    if (tierKeys.some((key) => draft.tiers[key].enabled && (!Number.isFinite(draft.tiers[key].percent) || draft.tiers[key].percent <= 0 || draft.tiers[key].percent >= 100))) { setError("Los porcentajes activos deben estar entre 0 y 99%."); return }
    const prices = draft.tiers
    if (!(prices.unit.salePrice >= prices.inner.salePrice && prices.inner.salePrice >= prices.master.salePrice)) { setError(`La promoción debe conservar Unidad (${formatCOP(prices.unit.salePrice)}) ≥ Inner (${formatCOP(prices.inner.salePrice)}) ≥ Master (${formatCOP(prices.master.salePrice)}).`); return }
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
      <Card className="h-fit"><CardContent className="space-y-4 p-5"><div><h2 className="font-bold">{draft && promotions.some((item) => item.sku === draft.sku) ? "Editar descuento" : "Crear descuento"}</h2><p className="text-xs text-muted-foreground">Activa las presentaciones y define un porcentaje diferente para cada una.</p></div><form onSubmit={save} className="space-y-4"><ProductSearchPicker products={storefrontProducts.filter((item) => item.active)} promotions={promotions} selected={draft ? productBySku[draft.sku] : undefined} resetKey={pickerReset} onSelect={chooseProduct} onClear={() => { setDraft(null); setError("") }} />{draft && <><Field label="Tipo"><Select value={draft.kind} onValueChange={(value) => value && setDraft({ ...draft, kind: value as PromotionKind })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="promocion">Promoción</SelectItem><SelectItem value="outlet">Outlet</SelectItem></SelectContent></Select></Field><div className="space-y-3"><Label>Descuento por lista de precio</Label>{tierKeys.map((key) => { const tier = draft.tiers[key]; return <div key={key} className={`rounded-lg border p-3 ${tier.enabled ? "border-accent/40 bg-accent/5" : "bg-muted/20"}`}><div className="flex items-center justify-between gap-3"><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={tier.enabled} onChange={(event) => updateTier(key, { enabled: event.target.checked })} />{tierNames[key]}</label><span className="text-xs text-muted-foreground">Base {formatCOP(tier.regularPrice)}</span></div><div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-3"><Field label="Descuento (%)"><Input type="number" min="0.01" max="99" step="0.01" disabled={!tier.enabled} value={tier.percent} onChange={(event) => updateTier(key, { percent: Number(event.target.value) })} /></Field><div className="min-w-28 rounded-md bg-background px-3 py-2 text-right text-sm"><p className="text-[11px] text-muted-foreground">Precio final</p><p className="font-bold text-emerald-700">{formatCOP(tier.salePrice)}</p></div></div></div> })}</div><div className={`rounded-lg p-3 text-sm ${draft.tiers.unit.salePrice >= draft.tiers.inner.salePrice && draft.tiers.inner.salePrice >= draft.tiers.master.salePrice ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}><p className="font-semibold">Jerarquía final: Unidad ≥ Inner ≥ Master</p><p className="mt-1">{formatCOP(draft.tiers.unit.salePrice)} ≥ {formatCOP(draft.tiers.inner.salePrice)} ≥ {formatCOP(draft.tiers.master.salePrice)}</p></div><div className="grid grid-cols-2 gap-3"><Field label="Inicia (opcional)"><Input type="date" value={draft.startsAt} onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })} /></Field><Field label="Termina (opcional)"><Input type="date" value={draft.endsAt} onChange={(event) => setDraft({ ...draft, endsAt: event.target.value })} /></Field></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} />Publicar descuento</label>{tierKeys.some((key) => draft.tiers[key].enabled && draft.tiers[key].salePrice < (productBySku[draft.sku]?.cost ?? 0)) && <p className="rounded-lg bg-amber-50 p-3 text-sm font-medium text-amber-800">Una o más presentaciones quedan por debajo del costo unitario.</p>}</>}{error && <p className="rounded-lg bg-rose-50 p-2 text-sm text-rose-700">{error}</p>}<Button type="submit" disabled={!draft} className="w-full">Guardar descuento</Button>{draft && <Button type="button" variant="ghost" className="w-full" onClick={() => { setDraft(null); setError(""); setPickerReset((value) => value + 1) }}>Cancelar</Button>}</form></CardContent></Card>
      <Card><CardContent className="p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">Descuentos registrados</h2><p className="text-xs text-muted-foreground">La promoción queda por revisar si cambia cualquiera de los tres precios base.</p></div><div className="relative w-full sm:w-64"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar artículo" className="pl-9" /></div></div><div className="space-y-3">{filtered.length === 0 && <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No hay descuentos para esta búsqueda.</p>}{filtered.map((promotion) => { const product = productBySku[promotion.sku]; const status = promotionStatus(promotion, product.priceTiers); return <div key={promotion.sku} className="flex flex-wrap items-center gap-3 rounded-xl border p-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{product.name}</p><Badge variant="outline">{promotion.kind === "outlet" ? "Outlet" : "Promoción"}</Badge><Badge className={status === "vigente" ? "bg-emerald-50 text-emerald-700" : status === "revisar" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"}>{status}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{product.sku} · Actualizado: {promotion.updatedAt ? new Date(promotion.updatedAt).toLocaleString("es-CO") : "Datos iniciales"}</p><div className="mt-2 flex flex-wrap gap-2">{tierKeys.filter((key) => promotion.tiers[key].enabled).map((key) => <span key={key} className="rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-800"><b>{tierNames[key]} −{promotion.tiers[key].percent}%</b> · {formatCOP(promotion.tiers[key].regularPrice)} → {formatCOP(promotion.tiers[key].salePrice)}</span>)}</div>{status === "revisar" && <p className="mt-2 text-xs text-amber-800">Cambió uno de los precios base. Revisa y guarda nuevamente antes de publicarla.</p>}{status === "invalida" && <p className="mt-2 text-xs text-rose-700">La configuración no conserva la jerarquía Unidad ≥ Inner ≥ Master.</p>}</div><div className="flex gap-1"><Button variant="outline" size="sm" onClick={() => chooseProduct(promotion.sku)}>Editar</Button><Button variant="ghost" size="icon" aria-label={`Quitar descuento de ${product.name}`} onClick={() => remove(promotion.sku)}><Trash2 className="h-4 w-4" /></Button></div></div> })}</div></CardContent></Card>
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

  const selectedSku = selected?.sku
  const selectedName = selected?.name
  useEffect(() => { if (selectedSku && selectedName) { setSearch(selectedName); setOpen(false); setHighlighted(-1) } }, [selectedSku, selectedName])
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
