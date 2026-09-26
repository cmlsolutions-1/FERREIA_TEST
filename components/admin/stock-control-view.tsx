"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Boxes, CircleDollarSign, Search, Warehouse } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCOP } from "@/lib/data"
import { INVENTORY_UPDATED_EVENT } from "@/lib/orders"
import { PRODUCT_UPDATED_EVENT } from "@/lib/cost-pricing"
import type { WarehouseRecord } from "@/lib/product-master"
import { getInventoryStock, getInventorySummary, type StockRow, type StockSummary } from "@/services/inventory.service"
import { getAllWarehouses } from "@/services/warehouses.service"

export function StockControlView() {
  const [rows, setRows] = useState<StockRow[]>([])
  const [warehouses, setWarehouses] = useState<WarehouseRecord[]>([])
  const [summary, setSummary] = useState<StockSummary | null>(null)
  const [query, setQuery] = useState("")
  const [warehouseId, setWarehouseId] = useState("todas")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [revision, setRevision] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true
    getAllWarehouses().then((data) => { if (mounted) setWarehouses(data) })
      .catch((reason) => { if (mounted) setError(reason instanceof Error ? reason.message : "No fue posible cargar las bodegas") })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1)
    window.addEventListener(INVENTORY_UPDATED_EVENT, refresh)
    window.addEventListener(PRODUCT_UPDATED_EVENT, refresh)
    window.addEventListener("focus", refresh)
    return () => {
      window.removeEventListener(INVENTORY_UPDATED_EVENT, refresh)
      window.removeEventListener(PRODUCT_UPDATED_EVENT, refresh)
      window.removeEventListener("focus", refresh)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      const filters = { search: query.trim() || undefined, warehouseId: warehouseId === "todas" ? undefined : warehouseId }
      Promise.all([
        getInventoryStock({ ...filters, page, limit: 20 }, controller.signal),
        getInventorySummary(filters, controller.signal),
      ]).then(([stock, totals]) => {
        if (controller.signal.aborted) return
        setRows(stock.data)
        setSummary(totals.data)
        setTotal(stock.meta?.total ?? 0)
        setTotalPages(stock.meta?.totalPages ?? 0)
        setError("")
      }).catch((reason) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "No fue posible cargar el inventario")
      }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    }, 250)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [page, query, warehouseId, revision])

  return <div className="space-y-4">
    {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Stat icon={Boxes} label="Unidades disponibles" value={(summary?.availableUnits ?? 0).toLocaleString("es-CO")} />
      <Stat icon={CircleDollarSign} label="Inventario valorizado" value={formatCOP(summary?.inventoryValue ?? 0)} />
      <Stat icon={AlertTriangle} label="Bajo mínimo" value={String(summary?.lowStockProducts ?? 0)} warning />
      <Stat icon={Warehouse} label="Bodegas activas" value={String(summary?.activeWarehouses ?? 0)} />
    </div>
    <Card><CardContent className="p-4"><div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar por referencia, artículo, SKU o marca..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); setLoading(true) }} /></div>
      <Select value={warehouseId} onValueChange={(value) => { if (value) { setWarehouseId(value); setPage(1); setLoading(true) } }}><SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todas las bodegas</SelectItem>{warehouses.filter((item) => item.active).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select>
    </div></CardContent></Card>
    <Card className="overflow-hidden"><div className="border-b px-4 py-3"><p className="font-semibold">Existencias por artículo</p><p className="text-xs text-muted-foreground">El maestro se administra desde Catálogo de artículos.</p></div>
      <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Referencia</TableHead><TableHead>Artículo</TableHead><TableHead>Bodega</TableHead><TableHead className="text-right">Disponible</TableHead><TableHead className="text-right">Mínimo</TableHead><TableHead className="text-right">Máximo</TableHead><TableHead className="text-right">Costo</TableHead><TableHead className="text-right">Valor existencia</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
        <TableBody>{rows.map((product) => {
          const state = product.stock <= product.stockMin ? "Reponer" : product.stockMax > 0 && product.stock > product.stockMax ? "Exceso" : "Normal"
          return <TableRow key={product.id} className={product.active ? "" : "opacity-60"}><TableCell className="font-mono font-bold">{product.reference}</TableCell><TableCell><p className="font-medium">{product.name}</p><p className="text-xs text-muted-foreground">{product.sku} · {product.brand}</p></TableCell><TableCell>{product.warehouse || "Sin bodega"}</TableCell><TableCell className="text-right text-lg font-bold">{product.stock}</TableCell><TableCell className="text-right">{product.stockMin}</TableCell><TableCell className="text-right">{product.stockMax}</TableCell><TableCell className="text-right">{formatCOP(product.cost)}</TableCell><TableCell className="text-right font-semibold">{formatCOP(product.stock * product.cost)}</TableCell><TableCell><Badge variant="secondary" className={state === "Reponer" ? "bg-rose-50 text-rose-700" : state === "Exceso" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}>{state}</Badge></TableCell></TableRow>
        })}</TableBody></Table></div>
      {loading && <p className="px-4 py-3 text-sm text-muted-foreground">Cargando existencias...</p>}
      {!loading && !error && rows.length === 0 && <p className="px-4 py-3 text-sm text-muted-foreground">No se encontraron artículos.</p>}
      <div className="flex items-center justify-between gap-3 border-t px-4 py-3 text-sm"><span className="text-muted-foreground">{total} artículos · Página {page} de {Math.max(totalPages, 1)}</span><div className="flex gap-2"><Button type="button" size="sm" variant="outline" disabled={page <= 1 || loading} onClick={() => { setPage((value) => value - 1); setLoading(true) }}>Anterior</Button><Button type="button" size="sm" variant="outline" disabled={page >= totalPages || loading} onClick={() => { setPage((value) => value + 1); setLoading(true) }}>Siguiente</Button></div></div>
    </Card>
  </div>
}

function Stat({ icon: Icon, label, value, warning }: { icon: typeof Boxes; label: string; value: string; warning?: boolean }) {
  return <Card><CardContent className="flex items-start justify-between p-4"><div><p className="text-xs text-muted-foreground">{label}</p><p className={warning ? "mt-1 text-xl font-bold text-amber-600" : "mt-1 text-xl font-bold"}>{value}</p></div><span className="rounded-xl bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" /></span></CardContent></Card>
}
