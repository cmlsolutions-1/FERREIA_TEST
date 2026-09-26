"use client"

import { useEffect, useMemo, useState } from "react"
import { Building2, Search, User } from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCOP } from "@/lib/data"
import { createCrmCustomer, getCustomerDirectory, type CreateCrmCustomerInput, type CustomerDirectoryRecord } from "@/services/customers.service"

const emptyForm: CreateCrmCustomerInput = { name: "", type: "Persona", document: "", email: "", phone: "", city: "" }
const segColor = { VIP: "bg-amber-100 text-amber-800", Frecuente: "bg-sky-100 text-sky-800", Nuevo: "bg-emerald-100 text-emerald-800" }
function normalize(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase() }

export default function ClientesPage() {
  const [customers, setCustomers] = useState<CustomerDirectoryRecord[]>([])
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CreateCrmCustomerInput>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [formError, setFormError] = useState("")
  const [notice, setNotice] = useState("")

  useEffect(() => {
    let active = true
    getCustomerDirectory().then((result) => { if (active) { setCustomers(result.data); setError("") } })
      .catch((failure) => { if (active) setError(failure instanceof Error ? failure.message : "No fue posible cargar los clientes") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => {
    const term = normalize(query)
    return customers.filter((customer) => !term || [customer.name, customer.email, customer.id, customer.city, customer.document].some((value) => normalize(value).includes(term)))
  }, [customers, query])

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (!form.document.trim() && !form.email.trim()) { setFormError("Ingresa un documento o correo para relacionar sus compras."); return }
    setSaving(true); setFormError("")
    try {
      await createCrmCustomer(form)
      const result = await getCustomerDirectory()
      setCustomers(result.data)
      setOpen(false); setForm({ ...emptyForm }); setNotice("Cliente creado correctamente."); setError("")
    } catch (failure) { setFormError(failure instanceof Error ? failure.message : "No fue posible crear el cliente") }
    finally { setSaving(false) }
  }

  return <div>
    <PageHeader title="Clientes" description="CRM conectado con las cuentas registradas y sus pedidos" action={<Button size="sm" onClick={() => { setForm({ ...emptyForm }); setFormError(""); setOpen(true) }}>Nuevo cliente</Button>} />
    {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {notice && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
    <div className="mb-4 grid gap-3 sm:grid-cols-3">
      <Metric label="Clientes" value={String(customers.length)} />
      <Metric label="Cuentas web" value={String(customers.filter((item) => item.origin === "Cuenta web").length)} />
      <Metric label="Valor histórico" value={formatCOP(customers.reduce((sum, item) => sum + item.total, 0))} />
    </div>
    <Card><CardContent className="space-y-4 p-4">
      <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nombre, correo, ID o ciudad..." className="pl-9" /></div>
      <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Origen</TableHead><TableHead>Ciudad</TableHead><TableHead className="text-right">Compras</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Última compra</TableHead><TableHead>Segmento</TableHead></TableRow></TableHeader><TableBody>
        {filtered.map((customer) => <TableRow key={customer.id}>
          <TableCell><div className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarFallback className="bg-secondary text-secondary-foreground">{customer.type === "Empresa" ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}</AvatarFallback></Avatar><div><p className="font-medium text-foreground">{customer.name}</p><p className="text-xs text-muted-foreground">{customer.email || customer.type} · {customer.id}</p></div></div></TableCell>
          <TableCell><Badge variant="outline" className={customer.origin === "Cuenta web" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}>{customer.origin}</Badge></TableCell>
          <TableCell className="text-sm">{customer.city}</TableCell><TableCell className="text-right">{customer.purchases}</TableCell><TableCell className="text-right font-medium">{formatCOP(customer.total)}</TableCell>
          <TableCell className="whitespace-nowrap text-sm">{customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString("es-CO") : "Sin compras"}</TableCell>
          <TableCell><Badge variant="secondary" className={`border-0 ${segColor[customer.segment]}`}>{customer.segment}</Badge></TableCell>
        </TableRow>)}
        {!filtered.length && <TableRow><TableCell colSpan={7} className="h-28 text-center text-muted-foreground">{loading ? "Cargando clientes..." : "No se encontraron clientes."}</TableCell></TableRow>}
      </TableBody></Table></div>
    </CardContent></Card>
    <Sheet open={open} onOpenChange={setOpen}><SheetContent className="w-full overflow-y-auto sm:max-w-lg"><SheetHeader><SheetTitle>Nuevo cliente</SheetTitle><SheetDescription>Registra un cliente en el CRM para relacionar sus pedidos.</SheetDescription></SheetHeader><form onSubmit={save} className="flex flex-1 flex-col gap-4 px-4 pb-4">
      {formError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{formError}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre o razón social *"><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></Field>
        <Field label="Tipo *"><Select value={form.type} onValueChange={(value) => value && setForm({ ...form, type: value as CreateCrmCustomerInput["type"] })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Persona">Persona</SelectItem><SelectItem value="Empresa">Empresa</SelectItem></SelectContent></Select></Field>
        <Field label="Documento / NIT"><Input value={form.document} onChange={(event) => setForm({ ...form, document: event.target.value })} /></Field>
        <Field label="Teléfono *"><Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required /></Field>
        <Field label="Ciudad *"><Input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} required /></Field>
        <Field label="Correo"><Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
      </div>
      <p className="text-xs text-muted-foreground">Ingresa documento o correo para asociar las compras de este cliente.</p>
      <SheetFooter className="px-0"><Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Crear cliente"}</Button></SheetFooter>
    </form></SheetContent></Sheet>
  </div>
}

function Metric({ label, value }: { label: string; value: string }) { return <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></CardContent></Card> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}</div> }
