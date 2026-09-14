"use client"

import { useMemo, useState } from "react"
import { Building2, Search, User } from "lucide-react"
import { NewCustomerAction } from "@/components/admin/admin-actions"
import { PageHeader } from "@/components/admin/page-header"
import { useCustomerSession } from "@/components/customer-session-provider"
import { useOrders } from "@/components/order-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CUSTOMERS, formatCOP } from "@/lib/data"

type CustomerRow = {
  id: string
  nombre: string
  tipo: "Persona" | "Empresa"
  ciudad: string
  compras: number
  total: number
  ultimaCompra: string
  segmento: "VIP" | "Frecuente" | "Nuevo"
  correo?: string
  origin: "Cuenta web" | "CRM"
}

const segColor: Record<CustomerRow["segmento"], string> = {
  VIP: "bg-amber-100 text-amber-800",
  Frecuente: "bg-sky-100 text-sky-800",
  Nuevo: "bg-emerald-100 text-emerald-800",
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase()
}

export default function ClientesPage() {
  const { accounts } = useCustomerSession()
  const { orders } = useOrders()
  const [query, setQuery] = useState("")

  const customers = useMemo<CustomerRow[]>(() => {
    const webCustomers = accounts.map<CustomerRow>((account) => {
      const customerOrders = orders
        .filter((order) => order.customerId === account.id || order.email.toLowerCase() === account.email.toLowerCase())
        .filter((order) => order.status !== "Cancelado")
      const latestOrder = [...customerOrders].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      const purchases = customerOrders.length
      return {
        id: account.id,
        nombre: account.name,
        tipo: "Persona",
        ciudad: latestOrder?.city ?? "Sin ciudad registrada",
        compras: purchases,
        total: customerOrders.reduce((sum, order) => sum + order.total, 0),
        ultimaCompra: latestOrder?.createdAt ?? "",
        segmento: purchases >= 10 ? "VIP" : purchases >= 3 ? "Frecuente" : "Nuevo",
        correo: account.email,
        origin: "Cuenta web",
      }
    })
    const registeredNames = new Set(accounts.map((account) => normalize(account.name)))
    const crmCustomers = CUSTOMERS
      .filter((customer) => !registeredNames.has(normalize(customer.nombre)))
      .map<CustomerRow>((customer) => ({ ...customer, origin: "CRM" }))
    return [...webCustomers, ...crmCustomers]
  }, [accounts, orders])

  const filtered = useMemo(() => {
    const term = normalize(query)
    if (!term) return customers
    return customers.filter((customer) =>
      [customer.nombre, customer.correo ?? "", customer.id, customer.ciudad]
        .some((value) => normalize(value).includes(term)),
    )
  }, [customers, query])

  const totalCartera = customers.reduce((sum, customer) => sum + customer.total, 0)

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="CRM conectado con las cuentas registradas y sus pedidos"
        action={<NewCustomerAction />}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Metric label="Clientes" value={String(customers.length)} />
        <Metric label="Cuentas web" value={String(accounts.length)} />
        <Metric label="Valor histórico" value={formatCOP(totalCartera)} />
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nombre, correo, ID o ciudad..." className="pl-9" />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Origen</TableHead><TableHead>Ciudad</TableHead><TableHead className="text-right">Compras</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Última compra</TableHead><TableHead>Segmento</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell><div className="flex items-center gap-3"><Avatar className="h-9 w-9"><AvatarFallback className="bg-secondary text-secondary-foreground">{customer.tipo === "Empresa" ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}</AvatarFallback></Avatar><div><p className="font-medium text-foreground">{customer.nombre}</p><p className="text-xs text-muted-foreground">{customer.correo ?? customer.tipo} · {customer.id}</p></div></div></TableCell>
                    <TableCell><Badge variant="outline" className={customer.origin === "Cuenta web" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}>{customer.origin}</Badge></TableCell>
                    <TableCell className="text-sm">{customer.ciudad}</TableCell>
                    <TableCell className="text-right">{customer.compras}</TableCell>
                    <TableCell className="text-right font-medium">{formatCOP(customer.total)}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{customer.ultimaCompra ? new Date(customer.ultimaCompra).toLocaleDateString("es-CO") : "Sin compras"}</TableCell>
                    <TableCell><Badge variant="secondary" className={`border-0 ${segColor[customer.segmento]}`}>{customer.segmento}</Badge></TableCell>
                  </TableRow>
                ))}
                {!filtered.length && <TableRow><TableCell colSpan={7} className="h-28 text-center text-muted-foreground">No se encontraron clientes.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></CardContent></Card>
}
