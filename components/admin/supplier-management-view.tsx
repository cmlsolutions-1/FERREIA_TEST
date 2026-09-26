"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Pencil, Plus, Power, Search, Truck, WalletCards } from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { formatCOP } from "@/lib/data"
import type { PurchaseOrder } from "@/lib/purchase-orders"
import { getAllCategories } from "@/services/categories.service"
import { getAllClassifications } from "@/services/classifications.service"
import { getPurchaseOrders } from "@/services/purchases.service"
import { createSupplier, getSupplierSummary, getSuppliers, updateSupplier, type SupplierInput, type SupplierRecord, type SupplierSummary } from "@/services/suppliers.service"

const emptyForm: SupplierInput = { name: "", nit: "", contact: "", city: "", category: "", commercialTerms: "" }
const emptySummary: SupplierSummary = { activeSuppliers: 0, references: 0, balance: 0, purchaseOrders: 0 }
const pageSize = 20
function quotedTotal(order: PurchaseOrder) { return order.quotedTotal ?? order.lines.reduce((sum, line) => sum + line.orderedQty * line.quotedUnitCost, 0) }

export function SupplierManagementView() {
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([])
  const [summary, setSummary] = useState<SupplierSummary>(emptySummary)
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([])
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [revision, setRevision] = useState(0)
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<SupplierInput>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [formError, setFormError] = useState("")
  const [notice, setNotice] = useState("")

  useEffect(() => {
    let active = true
    const timer = setTimeout(() => {
      getSuppliers(page, pageSize, query).then((result) => {
        if (!active) return
        setSuppliers(result.data)
        setTotalPages(Math.max(1, result.meta?.totalPages ?? 1))
        setError("")
      }).catch((failure) => { if (active) setError(failure instanceof Error ? failure.message : "No fue posible cargar los proveedores") })
    }, query ? 250 : 0)
    return () => { active = false; clearTimeout(timer) }
  }, [page, query, revision])

  useEffect(() => {
    let active = true
    getSupplierSummary().then((result) => { if (active) setSummary(result.data) }).catch((failure) => { if (active) setError(failure instanceof Error ? failure.message : "No fue posible cargar el resumen") })
    return () => { active = false }
  }, [revision])

  useEffect(() => {
    let active = true
    getPurchaseOrders(1, 4).then((result) => { if (active) setPurchases(result.data) }).catch((failure) => { if (active) setError(failure instanceof Error ? failure.message : "No fue posible cargar las compras") })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!open) return
    let active = true
    Promise.all([getAllCategories(), getAllClassifications()]).then(([storeCategories, classifications]) => {
      if (!active) return
      const names = [...storeCategories.map((item) => item.name), ...classifications.filter((item) => item.kind === "LINE" && item.active).map((item) => item.name)]
      const unique = new Map(names.map((name) => [name.trim().toLocaleLowerCase("es-CO"), name.trim()]))
      setCategories([...unique.values()].sort((a, b) => a.localeCompare(b, "es-CO")))
      setCategoriesLoading(false)
    }).catch((failure) => {
      if (!active) return
      setCategoriesLoading(false)
      setFormError(failure instanceof Error ? failure.message : "No fue posible cargar las categorías")
    })
    return () => { active = false }
  }, [open])

  function startCreate() { setEditingId(null); setForm({ ...emptyForm }); setCategoriesLoading(true); setFormError(""); setOpen(true) }
  function startEdit(supplier: SupplierRecord) {
    const { name, nit, contact, city, category, commercialTerms } = supplier
    setEditingId(supplier.id)
    setForm({ name, nit, contact, city, category, commercialTerms })
    setCategoriesLoading(true)
    setFormError("")
    setOpen(true)
  }
  function update<K extends keyof SupplierInput>(key: K, value: SupplierInput[K]) { setForm((current) => ({ ...current, [key]: value })) }
  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (categoriesLoading) return
    if (!editingId && !form.category.trim()) { setFormError("Selecciona una categoría principal."); return }
    setSaving(true)
    setFormError("")
    try {
      await (editingId ? updateSupplier(editingId, form) : createSupplier(form))
      setOpen(false)
      setPage(1)
      setQuery("")
      setRevision((current) => current + 1)
      setNotice(editingId ? "Proveedor actualizado correctamente." : "Proveedor creado correctamente.")
      setError("")
    } catch (failure) {
      setFormError(failure instanceof Error ? failure.message : "No fue posible guardar el proveedor")
    } finally { setSaving(false) }
  }

  const categoryOptions = form.category && !categories.includes(form.category) ? [form.category, ...categories] : categories
  async function toggle(supplier: SupplierRecord) {
    try {
      await updateSupplier(supplier.id, { active: !supplier.active })
      setRevision((current) => current + 1)
      setNotice(supplier.active ? "Proveedor desactivado." : "Proveedor activado.")
      setError("")
    } catch (failure) { setError(failure instanceof Error ? failure.message : "No fue posible cambiar el estado") }
  }

  return <div>
    <PageHeader title="Proveedores" description="Directorio comercial, cartera y cobertura de referencias por proveedor" action={<Button onClick={startCreate}><Plus className="h-4 w-4" />Nuevo proveedor</Button>} />
    {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {notice && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
    <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Proveedores activos" value={summary.activeSuppliers} />
      <Stat label="Referencias asociadas" value={summary.references} />
      <Stat label="Cartera proveedor" value={formatCOP(summary.balance)} />
      <Stat label="Órdenes de compra" value={summary.purchaseOrders} />
    </div>
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card><CardContent className="space-y-4 p-4">
        <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Buscar proveedores" placeholder="Buscar proveedor, NIT o ciudad..." className="pl-9" value={query} onChange={(event) => { setPage(1); setQuery(event.target.value) }} /></div>
        <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Proveedor</TableHead><TableHead>NIT</TableHead><TableHead>Ciudad</TableHead><TableHead>Contacto</TableHead><TableHead className="text-right">Productos</TableHead><TableHead className="text-right">Cartera</TableHead><TableHead>Estado</TableHead><TableHead /></TableRow></TableHeader><TableBody>
          {suppliers.map((supplier) => <TableRow key={supplier.id} className={!supplier.active ? "opacity-60" : ""}>
            <TableCell><p className="font-medium text-foreground">{supplier.name}</p><p className="text-xs text-muted-foreground">{supplier.id}{supplier.category ? ` · ${supplier.category}` : ""}</p></TableCell>
            <TableCell className="font-mono text-xs">{supplier.nit}</TableCell><TableCell>{supplier.city}</TableCell><TableCell className="whitespace-nowrap">{supplier.contact}</TableCell>
            <TableCell className="text-right">{supplier.productCount}</TableCell><TableCell className="text-right font-medium">{formatCOP(supplier.balance)}</TableCell>
            <TableCell><Badge variant="secondary" className={supplier.active ? supplier.balance > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}>{!supplier.active ? "Inactivo" : supplier.balance > 0 ? "Con saldo" : "Al día"}</Badge></TableCell>
            <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" aria-label={`Editar ${supplier.name}`} onClick={() => startEdit(supplier)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" aria-label={`${supplier.active ? "Desactivar" : "Activar"} ${supplier.name}`} onClick={() => toggle(supplier)}><Power className="h-4 w-4" /></Button></div></TableCell>
          </TableRow>)}
          {!suppliers.length && <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">No se encontraron proveedores.</TableCell></TableRow>}
        </TableBody></Table></div>
        <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Página {page} de {totalPages}</span><div className="flex gap-1"><Button variant="outline" size="icon" aria-label="Página anterior" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="icon" aria-label="Página siguiente" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button></div></div>
      </CardContent></Card>
      <Card><CardContent className="space-y-4 p-4"><div className="flex items-center gap-2"><Truck className="h-5 w-5 text-accent" /><h2 className="font-semibold">Compras recientes</h2></div><div className="space-y-3">{purchases.map((purchase) => <div key={purchase.id} className="rounded-lg border border-border p-3 text-sm"><div className="flex items-center justify-between gap-3"><p className="font-medium">{purchase.id}</p><Badge variant="secondary">{purchase.status}</Badge></div><p className="mt-1 truncate text-muted-foreground">{purchase.supplier}</p><p className="mt-2 flex items-center gap-1 font-medium"><WalletCards className="h-3.5 w-3.5 text-muted-foreground" />{formatCOP(quotedTotal(purchase))}</p></div>)}{!purchases.length && <p className="text-sm text-muted-foreground">Todavía no hay órdenes de compra.</p>}</div></CardContent></Card>
    </div>
    <Sheet open={open} onOpenChange={setOpen}><SheetContent className="w-full overflow-y-auto sm:max-w-lg"><SheetHeader><SheetTitle>{editingId ? "Editar proveedor" : "Nuevo proveedor"}</SheetTitle><SheetDescription>Datos comerciales para compras y referencias.</SheetDescription></SheetHeader><form onSubmit={save} className="flex flex-1 flex-col gap-4 px-4 pb-4">
      {formError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{formError}</p>}
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Proveedor *"><Input value={form.name} onChange={(event) => update("name", event.target.value)} required /></Field><Field label="NIT *"><Input value={form.nit} onChange={(event) => update("nit", event.target.value)} required /></Field><Field label="Contacto *"><Input value={form.contact} onChange={(event) => update("contact", event.target.value)} required /></Field><Field label="Ciudad *"><Input value={form.city} onChange={(event) => update("city", event.target.value)} required /></Field><div className="space-y-1.5 sm:col-span-2"><Label>Categoría principal *</Label><Select value={form.category} onValueChange={(value) => value && update("category", value)}><SelectTrigger className="w-full" disabled={categoriesLoading}><SelectValue placeholder={categoriesLoading ? "Cargando categorías..." : "Selecciona categoría"} /></SelectTrigger><SelectContent>{categoryOptions.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent></Select></div><div className="space-y-1.5 sm:col-span-2"><Label>Condiciones comerciales</Label><Textarea value={form.commercialTerms} onChange={(event) => update("commercialTerms", event.target.value)} placeholder="Crédito, tiempos de entrega, descuentos o mínimos de compra." rows={5} /></div></div>
      <SheetFooter className="px-0"><Button type="submit" disabled={saving || categoriesLoading}>{saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear proveedor"}</Button></SheetFooter>
    </form></SheetContent></Sheet>
  </div>
}

function Stat({ label, value }: { label: string; value: string | number }) { return <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></CardContent></Card> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}</div> }
