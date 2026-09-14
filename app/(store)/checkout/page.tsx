"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Banknote, Building2, CheckCircle2, CreditCard, LogIn, Package, PackageSearch, Truck, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCart } from "@/components/cart-provider"
import { useCustomerSession } from "@/components/customer-session-provider"
import { useOrders } from "@/components/order-provider"
import { DEPARTAMENTOS, formatCOP } from "@/lib/data"
import type { FerreiaOrder, PaymentStatus } from "@/lib/orders"
import { calculateTieredPrice } from "@/lib/pricing"
import { cn } from "@/lib/utils"

type CustomerForm = { name: string; document: string; email: string; phone: string; address: string; city: string; department: string }
const emptyForm: CustomerForm = { name: "", document: "", email: "", phone: "", address: "", city: "", department: "" }

export default function CheckoutPage() {
  const { lines, subtotal, count, clear } = useCart()
  const { user } = useCustomerSession()
  const { createOrder } = useOrders()
  const [shipping, setShipping] = useState<"estandar" | "express">("estandar")
  const [payment, setPayment] = useState<"tarjeta" | "pse" | "contraentrega">("tarjeta")
  const [form, setForm] = useState<CustomerForm>(emptyForm)
  const [completedOrder, setCompletedOrder] = useState<FerreiaOrder | null>(null)
  const [error, setError] = useState("")
  const [processing, setProcessing] = useState(false)
  const submissionLocked = useRef(false)

  useEffect(() => {
    if (user) setForm((current) => ({ ...current, name: user.name, document: user.document, email: user.email, phone: user.phone }))
  }, [user])

  const shippingCost = shipping === "express" ? 18000 : subtotal >= 150000 ? 0 : 12000
  const tax = Math.round(subtotal * 0.19)
  const total = subtotal + tax + shippingCost

  function update<K extends keyof CustomerForm>(key: K, value: CustomerForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function confirmOrder(event: React.FormEvent) {
    event.preventDefault()
    if (submissionLocked.current) return
    submissionLocked.current = true
    setProcessing(true)
    const paymentStatus: PaymentStatus = payment === "contraentrega" ? "Contra entrega" : "Pagado"
    const result = createOrder({
      customerId: user?.id ?? null,
      guest: !user,
      customerName: form.name.trim(),
      document: form.document.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      items: lines.map(({ product, qty }) => { const pricing = calculateTieredPrice(product, qty); return { productId: product.id, sku: product.sku, name: product.name, image: product.image, quantity: qty, unitPrice: pricing.averageUnitPrice, total: pricing.total } }),
      subtotal,
      tax,
      shippingCost,
      total,
      paymentMethod: payment === "tarjeta" ? "Tarjeta" : payment === "pse" ? "PSE" : "Contra entrega",
      paymentStatus,
      shippingMethod: shipping === "express" ? "Express" : "Estándar",
      address: form.address.trim(),
      city: form.city.trim(),
      department: form.department,
    })
    if (!result.order) {
      setError(result.error ?? "No fue posible crear el pedido.")
      submissionLocked.current = false
      setProcessing(false)
      return
    }
    setError("")
    setCompletedOrder(result.order)
    clear()
  }

  if (completedOrder) {
    return <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center"><span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50"><CheckCircle2 className="h-12 w-12 text-emerald-600" /></span><p className="mt-5 text-sm font-bold uppercase tracking-widest text-accent">Compra completada</p><h1 className="mt-1 text-3xl font-black text-primary">¡Pedido confirmado!</h1><p className="mt-3 max-w-xl text-muted-foreground">Tu pedido <b className="text-foreground">{completedOrder.id}</b> fue registrado y las unidades ya se descontaron del inventario. La entrega está estimada entre <b>{completedOrder.estimatedFrom}</b> y <b>{completedOrder.estimatedTo}</b>.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90"><Link href={`/rastrear-pedido?pedido=${completedOrder.id}`}><PackageSearch className="mr-2 h-4 w-4" />Rastrear mi pedido</Link></Button>{user && <Button asChild variant="outline"><Link href="/mi-cuenta">Ver mis pedidos</Link></Button>}<Button asChild variant="ghost"><Link href="/catalogo">Seguir comprando</Link></Button></div>{!user && <p className="mt-5 text-xs text-muted-foreground">Guarda el número del pedido. Para consultarlo necesitarás también el correo <b>{completedOrder.email}</b>.</p>}</div>
  }

  if (count === 0) return <div className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="text-2xl font-bold text-primary">No hay productos en el carrito</h1><Button asChild className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90"><Link href="/catalogo">Ir al catálogo</Link></Button></div>

  return <div className="mx-auto max-w-7xl px-4 py-8"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h1 className="text-2xl font-bold text-primary">Finalizar compra</h1><p className="mt-1 text-sm text-muted-foreground">Puedes comprar como invitado o utilizar tu cuenta.</p></div>{user ? <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"><UserCheck className="h-4 w-4" /><span>Comprando como <b>{user.name}</b></span></div> : <Button asChild variant="outline" size="sm"><Link href="/mi-cuenta"><LogIn className="mr-2 h-4 w-4" />Iniciar sesión opcionalmente</Link></Button>}</div>
    <form onSubmit={confirmOrder} className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]"><div className="space-y-6">
      {!user && <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 text-sm"><p className="font-semibold text-primary">Compra como invitado</p><p className="mt-1 text-muted-foreground">No necesitas crear una cuenta. Tu correo y el número del pedido permitirán consultar el envío.</p></div>}
      <Section title="Datos del cliente" icon={Building2}><div className="grid gap-4 sm:grid-cols-2"><Field label="Nombre completo" required><Input required value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Juan Pérez" /></Field><Field label="Documento (CC / NIT)" required><Input required value={form.document} onChange={(event) => update("document", event.target.value)} placeholder="1234567890" /></Field><Field label="Correo electrónico" required><Input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="correo@ejemplo.com" /></Field><Field label="Teléfono" required><Input required value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+57 300 000 0000" /></Field></div></Section>
      <Section title="Dirección de envío" icon={Truck}><div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Field label="Dirección" required><Input required value={form.address} onChange={(event) => update("address", event.target.value)} placeholder="Cra. 10 #20-30, Apto 401" /></Field></div><Field label="Ciudad" required><Input required value={form.city} onChange={(event) => update("city", event.target.value)} placeholder="Bogotá" /></Field><Field label="Departamento" required><Select required value={form.department} onValueChange={(value) => value && update("department", value)}><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger><SelectContent>{DEPARTAMENTOS.map((department) => <SelectItem key={department} value={department}>{department}</SelectItem>)}</SelectContent></Select></Field></div></Section>
      <Section title="Método de envío" icon={Package}><div className="grid gap-3 sm:grid-cols-2"><OptionCard active={shipping === "estandar"} onClick={() => setShipping("estandar")} title="Estándar (3-5 días)" desc={subtotal >= 150000 ? "Gratis" : formatCOP(12000)} /><OptionCard active={shipping === "express"} onClick={() => setShipping("express")} title="Express (24-48h)" desc={formatCOP(18000)} /></div></Section>
      <Section title="Método de pago" icon={CreditCard}><div className="grid gap-3 sm:grid-cols-3"><OptionCard active={payment === "tarjeta"} onClick={() => setPayment("tarjeta")} title="Tarjeta" desc="Crédito / débito" icon={CreditCard} /><OptionCard active={payment === "pse"} onClick={() => setPayment("pse")} title="PSE" desc="Débito bancario" icon={Building2} /><OptionCard active={payment === "contraentrega"} onClick={() => setPayment("contraentrega")} title="Contra entrega" desc="Paga al recibir" icon={Banknote} /></div>{payment === "tarjeta" && <div className="mt-4 grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Field label="Número de tarjeta"><Input placeholder="0000 0000 0000 0000" /></Field></div><Field label="Vencimiento"><Input placeholder="MM/AA" /></Field><Field label="CVV"><Input placeholder="123" /></Field></div>}</Section>
    </div>
      <aside className="h-fit rounded-xl border border-border bg-card p-5"><h2 className="font-semibold text-primary">Resumen final</h2><div className="mt-3 max-h-64 space-y-3 overflow-auto">{lines.map(({ product, qty }) => { const pricing = calculateTieredPrice(product, qty); return <div key={product.id} className="flex items-center gap-3 text-sm"><img src={product.image || "/placeholder.svg"} alt={product.name} className="h-12 w-12 rounded-md object-cover" /><div className="flex-1"><p className="line-clamp-1 font-medium">{product.name}</p><p className="text-xs text-muted-foreground">x{qty} · {formatCOP(pricing.averageUnitPrice)} / und</p></div><span className="font-medium">{formatCOP(pricing.total)}</span></div>})}</div><dl className="mt-4 space-y-2 border-t pt-4 text-sm"><Row label="Subtotal" value={formatCOP(subtotal)} /><Row label="IVA (19%)" value={formatCOP(tax)} /><Row label="Envío" value={shippingCost === 0 ? "Gratis" : formatCOP(shippingCost)} /><div className="mt-2 flex justify-between border-t pt-3 text-base"><dt className="font-semibold text-primary">Total</dt><dd className="font-bold text-primary">{formatCOP(total)}</dd></div></dl>{error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}<Button type="submit" disabled={processing} className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90">{processing ? "Creando pedido..." : "Confirmar pedido"}</Button><p className="mt-2 text-center text-xs text-muted-foreground">Al confirmar, las unidades se descuentan del inventario.</p></aside>
    </form>
  </div>
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) { return <div className="rounded-xl border border-border bg-card p-5"><h2 className="mb-4 flex items-center gap-2 font-semibold text-primary"><Icon className="h-5 w-5 text-accent" />{title}</h2>{children}</div> }
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <div className="space-y-1.5"><Label className="text-sm">{label} {required && <span className="text-destructive">*</span>}</Label>{children}</div> }
function OptionCard({ active, onClick, title, desc, icon: Icon }: { active: boolean; onClick: () => void; title: string; desc: string; icon?: React.ElementType }) { return <button type="button" onClick={onClick} className={cn("flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-colors", active ? "border-accent bg-accent/5" : "border-border hover:border-accent/50")}>{Icon && <Icon className={cn("h-5 w-5", active ? "text-accent" : "text-muted-foreground")} />}<div><p className="text-sm font-medium">{title}</p><p className="text-xs text-muted-foreground">{desc}</p></div></button> }
function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between"><dt className="text-muted-foreground">{label}</dt><dd>{value}</dd></div> }
