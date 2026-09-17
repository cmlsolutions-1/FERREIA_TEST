"use client"

import { useMemo, useState, type ComponentProps } from "react"
import Link from "next/link"
import { Eye, EyeOff, Fingerprint, LogIn, LogOut, PackageSearch, ShieldCheck, UserPlus } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCustomerSession } from "@/components/customer-session-provider"
import { useOrders } from "@/components/order-provider"
import { OrderTrackingPanel } from "@/components/store/order-tracking-panel"
import { formatCOP } from "@/lib/data"
import { HARDCODED_CUSTOMER_ACCOUNTS } from "@/lib/customer-accounts"

const demoAccess = HARDCODED_CUSTOMER_ACCOUNTS[0]

export function CustomerAccountView() {
  const { user, login, register, logout } = useCustomerSession()
  const { orders } = useOrders()
  const [error, setError] = useState("")
  const [selectedOrderId, setSelectedOrderId] = useState("")
  const customerOrders = useMemo(() => user ? orders.filter((order) => order.customerId === user.id || order.email.toLowerCase() === user.email.toLowerCase()) : [], [orders, user])
  const selectedOrder = customerOrders.find((order) => order.id === selectedOrderId)

  if (user) {
    return <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex items-center gap-4"><Avatar size="lg"><AvatarFallback className="bg-primary font-bold text-primary-foreground">{initials(user.name)}</AvatarFallback></Avatar><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-accent">Mi cuenta FERREIA</p><Badge className="bg-emerald-100 text-emerald-800"><ShieldCheck className="mr-1 h-3 w-3" />Sesión activa</Badge></div><h1 className="text-3xl font-black text-primary">Hola, {user.name}</h1><p className="mt-1 text-sm text-muted-foreground">Apareces como cliente registrado</p></div></div><Button variant="outline" onClick={() => { logout(); setSelectedOrderId("") }}><LogOut className="mr-2 h-4 w-4" />Cerrar sesión</Button></div>
      <Card className="mt-6"><CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4"><ProfileDatum label="Identificador de cliente" value={user.id} icon={Fingerprint} /><ProfileDatum label="Documento" value={user.document} /><ProfileDatum label="Correo de acceso" value={user.email} /><ProfileDatum label="Teléfono" value={user.phone} /></CardContent></Card>
      <div className="mt-7 grid gap-4 sm:grid-cols-3"><Summary label="Pedidos" value={String(customerOrders.length)} /><Summary label="En camino" value={String(customerOrders.filter((order) => ["Enviado", "En centro de distribución", "En tránsito", "En reparto"].includes(order.status)).length)} /><Summary label="Compras acumuladas" value={formatCOP(customerOrders.filter((order) => order.status !== "Cancelado").reduce((sum, order) => sum + order.total, 0))} /></div>
      <Card className="mt-5"><CardContent className="p-5"><div className="flex items-center justify-between"><div><h2 className="font-bold">Mis pedidos</h2><p className="text-xs text-muted-foreground">Compras realizadas con tu cuenta o con este mismo correo</p></div><Button asChild variant="outline" size="sm"><Link href="/rastrear-pedido"><PackageSearch className="mr-2 h-4 w-4" />Rastrear otro</Link></Button></div><div className="mt-4 divide-y">{customerOrders.map((order) => <button key={order.id} onClick={() => setSelectedOrderId(order.id)} className="flex w-full flex-col justify-between gap-2 py-4 text-left transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:px-2"><div><p className="font-mono font-bold">{order.id}</p><p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("es-CO")} · {order.items.length} referencias</p></div><div className="sm:text-right"><Badge variant="secondary">{order.status}</Badge><p className="mt-1 text-sm font-bold">{formatCOP(order.total)}</p></div></button>)}{!customerOrders.length && <div className="py-12 text-center text-sm text-muted-foreground">Todavía no tienes pedidos asociados. <Link href="/catalogo" className="font-semibold text-accent">Explorar catálogo</Link></div>}</div></CardContent></Card>
      {selectedOrder && <div className="mt-6"><OrderTrackingPanel order={selectedOrder} /></div>}
    </div>
  }

  return <div className="mx-auto max-w-5xl px-4 py-12">
    <div className="text-center"><h1 className="text-3xl font-black text-primary">Mi cuenta</h1><p className="mt-2 text-muted-foreground">Puedes comprar como invitado. La cuenta es opcional y reúne todos tus pedidos.</p></div>
    <Tabs defaultValue="login" className="mx-auto mt-7 max-w-xl"><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="login">Iniciar sesión</TabsTrigger><TabsTrigger value="register">Crear cuenta</TabsTrigger></TabsList>
      <TabsContent value="login"><Card><CardContent className="p-6"><form className="space-y-4" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); setError(login(String(data.get("email")), String(data.get("password"))) ?? "") }}><Field label="Correo"><Input name="email" type="email" autoComplete="email" required defaultValue={demoAccess.email} placeholder="correo@ejemplo.com" /></Field><Field label="Contraseña"><PasswordInput name="password" autoComplete="current-password" required defaultValue={demoAccess.password} /></Field>{error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}<Button type="submit" className="w-full"><LogIn className="mr-2 h-4 w-4" />Ingresar</Button></form></CardContent></Card></TabsContent>
      <TabsContent value="register"><Card><CardContent className="p-6"><form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); const password = String(data.get("password")); if (password !== String(data.get("passwordConfirmation"))) { setError("Las contraseñas no coinciden."); return } setError(register({ name: String(data.get("name")), document: String(data.get("document")), email: String(data.get("email")), phone: String(data.get("phone")), password }) ?? "") }}><div className="sm:col-span-2"><Field label="Nombre completo"><Input name="name" autoComplete="name" required /></Field></div><Field label="Documento"><Input name="document" autoComplete="off" required /></Field><Field label="Teléfono"><Input name="phone" type="tel" autoComplete="tel" required /></Field><div className="sm:col-span-2"><Field label="Correo"><Input name="email" type="email" autoComplete="email" required /></Field></div><Field label="Contraseña"><PasswordInput name="password" autoComplete="new-password" minLength={8} required /></Field><Field label="Confirmar contraseña"><PasswordInput name="passwordConfirmation" autoComplete="new-password" minLength={8} required /></Field>{error && <p className="sm:col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}<Button type="submit" className="sm:col-span-2"><UserPlus className="mr-2 h-4 w-4" />Crear cuenta e ingresar</Button></form></CardContent></Card></TabsContent>
    </Tabs>
    <p className="mt-5 text-center text-xs text-muted-foreground">La cuenta y la sesión quedan guardadas en este navegador durante la fase frontend.</p>
  </div>
}

function Summary({ label, value }: { label: string; value: string }) { return <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></CardContent></Card> }
function ProfileDatum({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) { return <div><p className="flex items-center gap-1.5 text-xs text-muted-foreground">{Icon && <Icon className="h-3.5 w-3.5" />}{label}</p><p className="mt-1 break-words text-sm font-semibold">{value}</p></div> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label>{label}</Label>{children}</div> }
function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() }

function PasswordInput({ className, ...props }: Omit<ComponentProps<typeof Input>, "type">) {
  const [visible, setVisible] = useState(false)
  return <div className="relative"><Input {...props} type={visible ? "text" : "password"} className={`pr-10 ${className ?? ""}`} /><button type="button" onClick={() => setVisible((current) => !current)} className="absolute right-1 top-1/2 flex h-7 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"} title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}>{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
}
