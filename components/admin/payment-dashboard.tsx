"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, ArrowDownToLine, Banknote, CheckCircle2, CircleDollarSign, Clock3, CreditCard, Eye, RefreshCw, Search, Settings2, ShieldCheck, WalletCards, Webhook, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCOP } from "@/lib/data"
import { detailLabels, statusLabels, type MercadoPagoConfiguration, type MercadoPagoPayment, type MercadoPagoStatus } from "@/lib/mercado-pago"
import { getPaymentConfiguration, getPayments, reconcileMercadoPagoPayments } from "@/services/payments.service"

const statusStyles: Record<MercadoPagoStatus, string> = {
  approved: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  in_process: "bg-sky-50 text-sky-700",
  rejected: "bg-rose-50 text-rose-700",
  refunded: "bg-violet-50 text-violet-700",
  cancelled: "bg-slate-100 text-slate-600",
}

const money = (value: number) => formatCOP(Math.round(value))

export function PaymentDashboard() {
  const [payments, setPayments] = useState<MercadoPagoPayment[]>([])
  const [configuration, setConfiguration] = useState<MercadoPagoConfiguration | null>(null)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [method, setMethod] = useState("all")
  const [selected, setSelected] = useState<MercadoPagoPayment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function load(reconcile = false) {
    setLoading(true)
    setError("")
    try {
      if (reconcile) await reconcileMercadoPagoPayments()
      const [paymentResponse, configurationResponse] = await Promise.all([getPayments(), getPaymentConfiguration()])
      setPayments(paymentResponse.data)
      setConfiguration(configurationResponse.data)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible consultar los pagos.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const visible = useMemo(() => {
    const clean = query.trim().toLowerCase()
    return payments.filter((item) =>
      (status === "all" || item.status === status)
      && (method === "all" || item.paymentType === method)
      && (!clean || [item.id, item.orderId, item.customer.name, item.customer.email, item.customer.document, item.paymentMethod].some((value) => value.toLowerCase().includes(clean))),
    )
  }, [payments, query, status, method])

  const approved = payments.filter((item) => item.status === "approved")
  const gross = approved.reduce((sum, item) => sum + item.amount, 0)
  const fees = approved.reduce((sum, item) => sum + item.marketplaceFee + item.financingFee + item.taxOnFee, 0)
  const net = approved.reduce((sum, item) => sum + item.netReceived, 0)
  const pending = payments.filter((item) => ["pending", "in_process"].includes(item.status))
  const paymentTypes = [...new Set(payments.map((item) => item.paymentType))]
  const methods = [
    { label: "Tarjeta de crédito", type: "credit_card", color: "bg-sky-500" },
    { label: "Tarjeta débito", type: "debit_card", color: "bg-blue-500" },
    { label: "PSE / transferencia", type: "bank_transfer", color: "bg-cyan-500" },
    { label: "Dinero en cuenta", type: "account_money", color: "bg-indigo-500" },
  ].map((item) => ({ ...item, value: payments.filter((payment) => payment.paymentType === item.type).reduce((sum, payment) => sum + payment.amount, 0) }))
  const methodTotal = Math.max(1, methods.reduce((sum, item) => sum + item.value, 0))

  function exportCsv() {
    const rows = [
      ["ID Mercado Pago", "Pedido", "Fecha", "Cliente", "Estado", "Detalle", "Medio", "Bruto", "Comisiones", "Reembolsado", "Neto"],
      ...visible.map((payment) => [payment.id, payment.orderId, payment.createdAt, payment.customer.name, statusLabels[payment.status], detailLabels[payment.statusDetail] ?? payment.statusDetail, payment.paymentMethod, payment.amount, payment.marketplaceFee + payment.financingFee + payment.taxOnFee, payment.refundedAmount, payment.netReceived]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = `pagos-mercado-pago-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return <div className="space-y-5">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
      <div>
        <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold">Pagos</h1><Badge className="border-0 bg-sky-100 text-sky-800">Mercado Pago</Badge><Badge variant="outline">Datos reales · PostgreSQL</Badge></div>
        <p className="mt-1 text-sm text-muted-foreground">Control financiero, estados y conciliación de las operaciones recibidas desde Mercado Pago.</p>
      </div>
      <Button variant="outline" onClick={() => void load(true)} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />{loading ? "Sincronizando..." : "Sincronizar Mercado Pago"}</Button>
    </div>

    {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    <ConnectionBanner configuration={configuration} />

    <Tabs defaultValue="overview">
      <div className="min-w-0 overflow-x-auto"><TabsList className="min-w-max"><TabsTrigger value="overview">Resumen</TabsTrigger><TabsTrigger value="transactions">Movimientos</TabsTrigger><TabsTrigger value="reconciliation">Conciliación</TabsTrigger><TabsTrigger value="settings">Configuración</TabsTrigger></TabsList></div>

      <TabsContent value="overview" className="mt-5 space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={CircleDollarSign} label="Pagos aprobados" value={money(gross)} detail={`${approved.length} operaciones`} tone="emerald" />
          <Metric icon={ArrowDownToLine} label="Neto a recibir" value={money(net)} detail="Después de cargos y reembolsos" tone="sky" />
          <Metric icon={Banknote} label="Costos de cobro" value={money(fees)} detail={gross ? `${((fees / gross) * 100).toFixed(2)}% del aprobado` : "0%"} tone="amber" />
          <Metric icon={Clock3} label="Pendiente / revisión" value={money(pending.reduce((sum, item) => sum + item.amount, 0))} detail={`${pending.length} operaciones`} tone="violet" />
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card><CardContent className="p-5"><div className="mb-5"><h2 className="font-bold">Distribución por medio de pago</h2><p className="text-xs text-muted-foreground">Valor intentado informado por la pasarela.</p></div><div className="space-y-5">{methods.map((item) => <div key={item.type}><div className="mb-2 flex justify-between text-sm"><span className="font-medium">{item.label}</span><span className="font-semibold tabular-nums">{money(item.value)}</span></div><div className="h-2.5 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value ? Math.max(2, item.value / methodTotal * 100) : 0}%` }} /></div><p className="mt-1 text-right text-xs text-muted-foreground">{(item.value / methodTotal * 100).toFixed(1)}%</p></div>)}</div></CardContent></Card>
          <Card><CardContent className="p-5"><h2 className="font-bold">Salud de la operación</h2><p className="mb-4 text-xs text-muted-foreground">Indicadores calculados con los pagos guardados.</p><div className="space-y-3"><Health label="Tasa de aprobación" value={`${payments.length ? Math.round(approved.length / payments.length * 100) : 0}%`} icon={CheckCircle2} style="bg-emerald-50 text-emerald-700" /><Health label="Pagos esperando acción" value={String(pending.length)} icon={Clock3} style="bg-amber-50 text-amber-700" /><Health label="Pagos rechazados" value={String(payments.filter((payment) => payment.status === "rejected").length)} icon={AlertTriangle} style="bg-rose-50 text-rose-700" /><Health label="Webhooks con firma válida" value={`${payments.filter((payment) => payment.webhook.signatureValid).length}/${payments.length}`} icon={ShieldCheck} style="bg-sky-50 text-sky-700" /></div></CardContent></Card>
        </div>
        <RecentPayments payments={payments.slice(0, 5)} select={setSelected} />
      </TabsContent>

      <TabsContent value="transactions" className="mt-5 space-y-4">
        <Card><CardContent className="grid gap-3 p-4 lg:grid-cols-[1fr_200px_210px_auto]"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar pago, pedido, cliente, correo o documento..." /></div><Select value={status} onValueChange={(value) => value && setStatus(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos los estados</SelectItem>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select><Select value={method} onValueChange={(value) => value && setMethod(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos los medios</SelectItem>{paymentTypes.map((value) => <SelectItem key={value} value={value}>{value.replaceAll("_", " ")}</SelectItem>)}</SelectContent></Select><Button variant="outline" onClick={exportCsv}>Exportar CSV</Button></CardContent></Card>
        <PaymentTable payments={visible} select={setSelected} />
      </TabsContent>

      <TabsContent value="reconciliation" className="mt-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-3"><Metric icon={WalletCards} label="Bruto acreditado" value={money(gross)} detail="Ventas aprobadas" tone="sky" /><Metric icon={Banknote} label="Deducciones" value={money(fees + approved.reduce((sum, payment) => sum + payment.refundedAmount, 0))} detail="Comisiones, impuestos y devoluciones" tone="amber" /><Metric icon={CheckCircle2} label="Neto conciliado" value={money(net)} detail="Informado por Mercado Pago" tone="emerald" /></div>
        <Card><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Pago</TableHead><TableHead>Fecha de liberación</TableHead><TableHead className="text-right">Bruto</TableHead><TableHead className="text-right">Comisión</TableHead><TableHead className="text-right">IVA comisión</TableHead><TableHead className="text-right">Reembolsos</TableHead><TableHead className="text-right">Neto</TableHead></TableRow></TableHeader><TableBody>{approved.map((payment) => <TableRow key={payment.id}><TableCell><p className="font-mono font-semibold">{payment.id}</p><p className="text-xs text-muted-foreground">{payment.orderId}</p></TableCell><TableCell>{payment.moneyReleaseDate ? new Date(payment.moneyReleaseDate).toLocaleDateString("es-CO") : "Pendiente"}</TableCell><TableCell className="text-right tabular-nums">{money(payment.amount)}</TableCell><TableCell className="text-right tabular-nums text-amber-700">-{money(payment.marketplaceFee + payment.financingFee)}</TableCell><TableCell className="text-right tabular-nums text-amber-700">-{money(payment.taxOnFee)}</TableCell><TableCell className="text-right tabular-nums text-violet-700">-{money(payment.refundedAmount)}</TableCell><TableCell className="text-right font-bold tabular-nums text-emerald-700">{money(payment.netReceived)}</TableCell></TableRow>)}{!approved.length && <TableRow><TableCell colSpan={7} className="h-28 text-center text-muted-foreground">Todavía no hay pagos aprobados para conciliar.</TableCell></TableRow>}</TableBody></Table></CardContent></Card>
      </TabsContent>

      <TabsContent value="settings" className="mt-5">
        <ConfigurationCard configuration={configuration} />
      </TabsContent>
    </Tabs>

    {selected && <PaymentDetail payment={selected} close={() => setSelected(null)} />}
  </div>
}

function ConnectionBanner({ configuration }: { configuration: MercadoPagoConfiguration | null }) {
  const connected = Boolean(configuration?.accessTokenConfigured)
  return <div className={`flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center ${connected ? "border-sky-200 bg-gradient-to-r from-sky-50 to-cyan-50" : "border-amber-200 bg-amber-50"}`}><div className="flex items-center gap-3"><span className={`rounded-full p-2 text-white ${connected ? "bg-sky-500" : "bg-amber-500"}`}><ShieldCheck className="h-5 w-5" /></span><div><p className="font-semibold">{connected ? "Mercado Pago conectado" : "Mercado Pago pendiente de configuración"}</p><p className="text-xs text-muted-foreground">{connected ? "Los cobros se crean en la pasarela y sus estados se guardan en PostgreSQL." : "Configura las credenciales del servidor para habilitar los cobros."}</p></div></div><Badge className={`w-fit border-0 ${configuration?.environment === "production" ? "bg-emerald-600 text-white" : "bg-sky-600 text-white"}`}>{configuration?.environment === "production" ? "Producción" : "Pruebas / Sandbox"}</Badge></div>
}

function ConfigurationCard({ configuration }: { configuration: MercadoPagoConfiguration | null }) {
  return <Card><div className="flex items-center gap-3 border-b px-5 py-4"><span className="rounded-xl bg-sky-100 p-2.5 text-sky-700"><Settings2 className="h-5 w-5" /></span><div><h2 className="font-bold">Conexión con Mercado Pago</h2><p className="text-xs text-muted-foreground">Configuración efectiva leída desde las variables del servidor.</p></div></div><CardContent className="space-y-5 p-5"><div className="grid gap-3 md:grid-cols-2"><SecretState label="Access token" configured={Boolean(configuration?.accessTokenConfigured)} variable="MERCADOPAGO_ACCESS_TOKEN" /><SecretState label="Public key" configured={Boolean(configuration?.publicKeyConfigured)} variable="NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY" /><SecretState label="Firma de Webhook" configured={Boolean(configuration?.webhookSecretConfigured)} variable="MERCADOPAGO_WEBHOOK_SECRET" /><SecretState label="URL pública HTTPS" configured={Boolean(configuration?.appUrlPublic)} variable="NEXT_PUBLIC_APP_URL" /></div><div className="grid gap-3 rounded-xl border bg-muted/20 p-4 text-sm md:grid-cols-2"><div><p className="text-xs uppercase text-muted-foreground">Ambiente</p><p className="font-semibold">{configuration?.environment === "production" ? "Producción" : "Pruebas / Sandbox"}</p></div><div><p className="text-xs uppercase text-muted-foreground">Descriptor</p><p className="font-semibold">{configuration?.statementDescriptor ?? "FERREIA"}</p></div><div className="md:col-span-2"><p className="text-xs uppercase text-muted-foreground">Webhook</p><p className="break-all font-mono text-xs">{configuration?.webhookUrl ?? "Por configurar"}</p></div></div>{!configuration?.appUrlPublic && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-semibold">El entorno local no puede recibir Webhooks externos</p><p className="mt-1">Para probar notificaciones automáticas usa una URL HTTPS pública temporal y actualiza <code>NEXT_PUBLIC_APP_URL</code>. El retorno del comprador también sincroniza el pago directamente con la API.</p></div>} {!configuration?.webhookSecretConfigured && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-semibold">Falta la firma secreta del Webhook</p><p className="mt-1">Cópiala desde Tus integraciones → Webhooks en Mercado Pago. Mientras tanto FERREIA confirma cada operación consultando la API oficial, pero la notificación aparecerá sin firma validada.</p></div>}</CardContent></Card>
}

function Metric({ icon: Icon, label, value, detail, tone }: { icon: typeof CreditCard; label: string; value: string; detail: string; tone: "emerald" | "sky" | "amber" | "violet" }) { const styles = { emerald: "bg-emerald-50 text-emerald-700", sky: "bg-sky-50 text-sky-700", amber: "bg-amber-50 text-amber-700", violet: "bg-violet-50 text-violet-700" }; return <Card><CardContent className="flex items-start justify-between p-4"><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold tabular-nums">{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{detail}</p></div><span className={`rounded-xl p-2.5 ${styles[tone]}`}><Icon className="h-5 w-5" /></span></CardContent></Card> }
function Health({ label, value, icon: Icon, style }: { label: string; value: string; icon: typeof Clock3; style: string }) { return <div className="flex items-center justify-between rounded-xl border p-3"><div className="flex items-center gap-3"><span className={`rounded-lg p-2 ${style}`}><Icon className="h-4 w-4" /></span><span className="text-sm font-medium">{label}</span></div><b>{value}</b></div> }
function RecentPayments({ payments, select }: { payments: MercadoPagoPayment[]; select: (payment: MercadoPagoPayment) => void }) { return <Card><div className="border-b px-5 py-4"><h2 className="font-bold">Actividad reciente</h2><p className="text-xs text-muted-foreground">Últimas operaciones informadas por Mercado Pago.</p></div><CardContent className="p-0"><PaymentTable payments={payments} select={select} /></CardContent></Card> }
function PaymentTable({ payments, select }: { payments: MercadoPagoPayment[]; select: (payment: MercadoPagoPayment) => void }) { return <Card className="overflow-hidden"><Table><TableHeader><TableRow><TableHead>Pago / pedido</TableHead><TableHead>Fecha</TableHead><TableHead>Cliente</TableHead><TableHead>Medio</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Bruto</TableHead><TableHead className="text-right">Neto</TableHead><TableHead /></TableRow></TableHeader><TableBody>{payments.map((payment) => <TableRow key={payment.id}><TableCell><p className="font-mono font-semibold">{payment.id}</p><p className="text-xs font-medium text-sky-700">{payment.orderId}</p></TableCell><TableCell><p>{new Date(payment.createdAt).toLocaleDateString("es-CO")}</p><p className="text-xs text-muted-foreground">{new Date(payment.createdAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}</p></TableCell><TableCell><p className="font-medium">{payment.customer.name}</p><p className="text-xs text-muted-foreground">{payment.customer.email}</p></TableCell><TableCell><p>{payment.paymentMethod}</p><p className="text-xs text-muted-foreground">{payment.installments > 1 ? `${payment.installments} cuotas` : "Pago único"}{payment.cardLastFour ? ` · •••• ${payment.cardLastFour}` : ""}</p></TableCell><TableCell><Status payment={payment} /></TableCell><TableCell className="text-right font-semibold tabular-nums">{money(payment.amount)}</TableCell><TableCell className="text-right font-bold tabular-nums text-emerald-700">{payment.netReceived ? money(payment.netReceived) : "—"}</TableCell><TableCell><Button variant="ghost" size="icon" aria-label={`Ver pago ${payment.id}`} onClick={() => select(payment)}><Eye className="h-4 w-4" /></Button></TableCell></TableRow>)}{!payments.length && <TableRow><TableCell colSpan={8} className="h-36 text-center text-muted-foreground">Todavía no hay pagos reales registrados.</TableCell></TableRow>}</TableBody></Table></Card> }
function Status({ payment }: { payment: MercadoPagoPayment }) { return <div><Badge variant="secondary" className={statusStyles[payment.status]}>{statusLabels[payment.status]}</Badge><p className="mt-1 max-w-48 text-xs text-muted-foreground">{detailLabels[payment.statusDetail] ?? payment.statusDetail}</p></div> }
function SecretState({ label, configured, variable }: { label: string; configured: boolean; variable: string }) { return <div className="flex items-center justify-between rounded-xl border p-4"><div><p className="text-sm font-semibold">{label}</p><code className="text-xs text-muted-foreground">{variable}</code></div><Badge variant="secondary" className={configured ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>{configured ? "Configurada" : "Pendiente"}</Badge></div> }

function PaymentDetail({ payment, close }: { payment: MercadoPagoPayment; close: () => void }) {
  const charges = payment.marketplaceFee + payment.financingFee + payment.taxOnFee
  const fields = [["ID Mercado Pago", payment.id], ["Referencia externa", payment.externalReference], ["Pedido FERREIA", payment.orderId], ["Tipo de operación", payment.operationType], ["Estado técnico", payment.status], ["Detalle técnico", payment.statusDetail], ["Medio de pago", payment.paymentMethod], ["Tipo", payment.paymentType], ["Cuotas", String(payment.installments)], ["Tarjeta", payment.cardLastFour ? `•••• ${payment.cardLastFour}` : "No aplica"], ["Descriptor", payment.statementDescriptor], ["Liberación estimada", payment.moneyReleaseDate ? new Date(payment.moneyReleaseDate).toLocaleDateString("es-CO") : "Sin fecha"]]
  const returnSync = payment.webhook.lastEvent === "payment.return"
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"><button aria-label="Cerrar detalle" className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" onClick={close} /><Card className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden border-0 shadow-2xl"><div className="flex items-center justify-between border-b px-5 py-4"><div><div className="flex items-center gap-2"><h2 className="text-lg font-bold">Detalle del pago</h2><Status payment={payment} /></div><p className="mt-1 font-mono text-xs text-muted-foreground">{payment.id} · {payment.orderId}</p></div><Button variant="ghost" size="icon" onClick={close}><X className="h-5 w-5" /></Button></div><div className="min-h-0 overflow-y-auto p-5"><div className="grid gap-5 lg:grid-cols-[1fr_340px]"><div className="space-y-5"><section><h3 className="mb-3 font-semibold">Información de la operación</h3><div className="grid gap-3 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label} className="rounded-lg border bg-muted/20 p-3"><p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 break-all text-sm font-semibold">{value}</p></div>)}</div></section><section><h3 className="mb-3 font-semibold">Comprador</h3><div className="rounded-xl border p-4"><p className="font-semibold">{payment.customer.name}</p><p className="text-sm text-muted-foreground">{payment.customer.email} · Documento {payment.customer.document}</p></div></section></div><aside className="space-y-4"><div className="rounded-xl bg-slate-950 p-5 text-white"><p className="text-xs text-slate-300">Resumen financiero</p><MoneyRow label="Pago bruto" value={payment.amount} /><MoneyRow label="Comisiones" value={-payment.marketplaceFee} /><MoneyRow label="Financiación" value={-payment.financingFee} /><MoneyRow label="IVA sobre cargos" value={-payment.taxOnFee} /><MoneyRow label="Reembolsado" value={-payment.refundedAmount} /><div className="mt-4 flex items-center justify-between border-t border-white/20 pt-4"><span className="font-semibold">Neto recibido</span><b className="text-xl text-emerald-300">{money(payment.netReceived)}</b></div><p className="mt-2 text-xs text-slate-400">Cargos totales: {money(charges)}</p></div><div className="rounded-xl border p-4"><p className="flex items-center gap-2 font-semibold"><Webhook className="h-4 w-4 text-sky-600" />Última sincronización</p><p className="mt-3 text-sm">{payment.webhook.lastEvent}</p><p className="text-xs text-muted-foreground">{new Date(payment.webhook.receivedAt).toLocaleString("es-CO")}</p><Badge variant="secondary" className={payment.webhook.signatureValid ? "mt-3 bg-emerald-50 text-emerald-700" : returnSync ? "mt-3 bg-sky-50 text-sky-700" : "mt-3 bg-amber-50 text-amber-700"}>{payment.webhook.signatureValid ? "Webhook con firma válida" : returnSync ? "Confirmado consultando la API" : "Webhook sin firma validada"}</Badge></div></aside></div></div></Card></div>
}

function MoneyRow({ label, value }: { label: string; value: number }) { return <div className="mt-3 flex justify-between text-sm"><span className="text-slate-300">{label}</span><span className="tabular-nums">{value < 0 ? `-${money(Math.abs(value))}` : money(value)}</span></div> }
