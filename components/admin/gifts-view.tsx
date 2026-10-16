"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Gift, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCOP } from "@/lib/data"
import { getProducts, type ProductRecord } from "@/services/products.service"
import { createGiftTier, deleteGiftTier, getGiftTiers, updateGiftTier, type GiftTier, type GiftTierInput } from "@/services/gifts.service"

type Draft = { id?: string; minSubtotal: string; maxSubtotal: string; stepAmount: string; productId: string; active: boolean }
const blank: Draft = { minSubtotal: "", maxSubtotal: "", stepAmount: "", productId: "", active: true }

export function GiftsView() {
  const [tiers, setTiers] = useState<GiftTier[]>([])
  const [draft, setDraft] = useState<Draft>(blank)
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  async function load() {
    try { setTiers((await getGiftTiers(true)).data); setError("") }
    catch (failure) { setError(failure instanceof Error ? failure.message : "No fue posible cargar las reglas") }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])
  useEffect(() => {
    let stale = false
    const timer = window.setTimeout(() => {
      getProducts({ admin: true, category: "gp", search: query, active: true, limit: 20 })
        .then((result) => { if (!stale) setProducts(result.data) })
        .catch(() => { if (!stale) setProducts([]) })
    }, 200)
    return () => { stale = true; window.clearTimeout(timer) }
  }, [query])

  function edit(tier: GiftTier) {
    setDraft({ id: tier.id, minSubtotal: String(tier.minSubtotal), maxSubtotal: tier.maxSubtotal === null ? "" : String(tier.maxSubtotal), stepAmount: String(tier.stepAmount), productId: tier.productId, active: tier.active })
    setQuery(tier.product.name)
    setError("")
    setNotice("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const input: GiftTierInput = {
      minSubtotal: Number(draft.minSubtotal), maxSubtotal: draft.maxSubtotal.trim() === "" ? null : Number(draft.maxSubtotal),
      stepAmount: Number(draft.stepAmount), productId: draft.productId, active: draft.active,
    }
    if (!draft.minSubtotal || !draft.stepAmount || !draft.productId || input.stepAmount <= 0) { setError("Completa la base, el incremento y el artículo GP."); return }
    setSaving(true); setError(""); setNotice("")
    try {
      if (draft.id) await updateGiftTier(draft.id, input)
      else await createGiftTier(input)
      setDraft(blank); setQuery(""); setNotice("Regla guardada correctamente")
      await load()
    } catch (failure) { setError(failure instanceof Error ? failure.message : "No fue posible guardar la regla") }
    finally { setSaving(false) }
  }

  async function remove(tier: GiftTier) {
    if (!window.confirm(`¿Eliminar la regla de ${tier.product.name}?`)) return
    try { await deleteGiftTier(tier.id); if (draft.id === tier.id) { setDraft(blank); setQuery("") }; await load() }
    catch (failure) { setError(failure instanceof Error ? failure.message : "No fue posible eliminar la regla") }
  }

  return <div className="space-y-6">
    <div><div className="flex items-center gap-2"><Gift className="h-6 w-6 text-amber-600" /><h1 className="text-2xl font-bold">Obsequios</h1><Badge variant="outline">PostgreSQL</Badge></div><p className="mt-1 text-sm text-muted-foreground">Configura un obsequio por pedido según el subtotal de artículos. Los productos de regalo deben pertenecer a la categoría GP.</p></div>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card><CardContent className="space-y-4 p-5"><div><h2 className="font-semibold">{draft.id ? "Editar regla" : "Crear regla"}</h2><p className="text-xs text-muted-foreground">Cada tramo comienza en la base y termina antes del límite superior. El regalo se obtiene al sumar el incremento a la base.</p></div>
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3"><div><Label htmlFor="gift-min">Base del tramo</Label><Input id="gift-min" type="number" min="0" step="0.01" required value={draft.minSubtotal} onChange={(event) => setDraft({ ...draft, minSubtotal: event.target.value })} /></div><div><Label htmlFor="gift-max">Límite superior</Label><Input id="gift-max" type="number" min="0" step="0.01" placeholder="Sin límite" value={draft.maxSubtotal} onChange={(event) => setDraft({ ...draft, maxSubtotal: event.target.value })} /></div><div><Label htmlFor="gift-step">Compra adicional</Label><Input id="gift-step" type="number" min="0.01" step="0.01" required value={draft.stepAmount} onChange={(event) => setDraft({ ...draft, stepAmount: event.target.value })} /></div></div>
          {draft.minSubtotal && draft.stepAmount && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">Ejemplo: con base {formatCOP(Number(draft.minSubtotal))} y compra adicional {formatCOP(Number(draft.stepAmount))}, se obtiene el obsequio desde {formatCOP(Number(draft.minSubtotal) + Number(draft.stepAmount))}.</p>}
          <div><Label htmlFor="gift-search">Artículo de regalo · categoría GP</Label><div className="relative mt-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="gift-search" value={query} onChange={(event) => { setQuery(event.target.value); setDraft((current) => ({ ...current, productId: "" })) }} placeholder="Buscar por nombre o referencia" className="pl-9" /></div><div className="mt-2 max-h-48 overflow-y-auto rounded-lg border">{products.map((product) => <button key={product.id} type="button" onClick={() => { setDraft({ ...draft, productId: product.id }); setQuery(product.name) }} className={`flex w-full items-center gap-2 border-b p-2 text-left text-sm last:border-0 hover:bg-muted/60 ${draft.productId === product.id ? "bg-amber-50" : ""}`}><Image src={product.image || "/placeholder.svg"} alt="" width={36} height={36} className="h-9 w-9 rounded object-cover" /><span className="min-w-0 flex-1 truncate">{product.name}<span className="block text-xs text-muted-foreground">{product.reference} · {product.stock} disponibles</span></span>{draft.productId === product.id && <Badge>Elegido</Badge>}</button>)}{products.length === 0 && <p className="p-3 text-xs text-muted-foreground">No hay artículos GP que coincidan. Crea uno en Catálogo de artículos.</p>}</div></div>
          {draft.productId && products.find((product) => product.id === draft.productId)?.stock === 0 && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">El artículo elegido no tiene existencias. Aunque guardes la regla activa, el carrito no mostrará este obsequio hasta que ingreses stock en Catálogo de artículos.</p>}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} />Regla activa</label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{notice && <p className="text-sm text-emerald-700">{notice}</p>}
          <div className="flex gap-2"><Button type="submit" disabled={saving}><Plus className="mr-2 h-4 w-4" />{saving ? "Guardando..." : draft.id ? "Guardar cambios" : "Crear regla"}</Button>{draft.id && <Button type="button" variant="outline" onClick={() => { setDraft(blank); setQuery("") }}>Cancelar</Button>}</div>
        </form>
      </CardContent></Card>

      <div className="space-y-3"><h2 className="font-semibold">Tramos configurados</h2>{loading && <p className="text-sm text-muted-foreground">Cargando...</p>}{!loading && tiers.length === 0 && <Card><CardContent className="p-5 text-sm text-muted-foreground">Todavía no hay reglas. La tienda no prometerá obsequios hasta que crees una.</CardContent></Card>}{tiers.map((tier) => <Card key={tier.id}><CardContent className="space-y-3 p-4"><div className="flex items-start justify-between gap-2"><div><Badge variant={tier.active ? "default" : "secondary"}>{tier.active ? "Activa" : "Inactiva"}</Badge><p className="mt-2 font-semibold">Desde {formatCOP(tier.minSubtotal)}{tier.maxSubtotal !== null ? ` hasta antes de ${formatCOP(tier.maxSubtotal)}` : " en adelante"}</p><p className="text-xs text-muted-foreground">Meta: {formatCOP(tier.minSubtotal + tier.stepAmount)}</p></div><div className="flex"><Button variant="ghost" size="icon" onClick={() => edit(tier)} aria-label="Editar regla"><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => void remove(tier)} aria-label="Eliminar regla"><Trash2 className="h-4 w-4" /></Button></div></div><div className="flex items-center gap-2 border-t pt-3"><Image src={tier.product.image} alt="" width={44} height={44} className="h-11 w-11 rounded object-cover" /><div><p className="text-sm font-medium">{tier.product.name}</p><p className="text-xs text-muted-foreground">{tier.product.reference} · {tier.product.stock} disponibles</p></div></div>{tier.active && (!tier.product.active || tier.product.stock <= 0) && <p role="status" className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900">No se mostrará en el carrito: {tier.product.active ? "el artículo GP no tiene existencias" : "el artículo GP está inactivo"}.</p>}</CardContent></Card>)}</div>
    </div>
  </div>
}
