"use client"
import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Boxes, CircleDollarSign, Search, Warehouse } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCOP } from "@/lib/data"
import { INVENTORY_UPDATED_EVENT } from "@/lib/orders"
import { initialProductMaster, initialWarehouses, ProductMaster, PRODUCT_STORAGE_KEY, WarehouseRecord, WAREHOUSE_STORAGE_KEY } from "@/lib/product-master"

export function StockControlView() {
  const [products, setProducts] = useState(initialProductMaster); const [warehouses, setWarehouses] = useState(initialWarehouses); const [query, setQuery] = useState(""); const [warehouse, setWarehouse] = useState("todas")
  useEffect(() => {
    function load() {
      const p = localStorage.getItem(PRODUCT_STORAGE_KEY)
      const w = localStorage.getItem(WAREHOUSE_STORAGE_KEY)
      if (p) setProducts(JSON.parse(p) as ProductMaster[])
      if (w) setWarehouses(JSON.parse(w) as WarehouseRecord[])
    }
    load()
    window.addEventListener(INVENTORY_UPDATED_EVENT, load)
    window.addEventListener("storage", load)
    return () => {
      window.removeEventListener(INVENTORY_UPDATED_EVENT, load)
      window.removeEventListener("storage", load)
    }
  }, [])
  const filtered = useMemo(() => products.filter((p) => (warehouse === "todas" || p.warehouse === warehouse) && (!query || [p.reference, p.name, p.sku, p.brand].some((v) => v.toLowerCase().includes(query.toLowerCase())))), [products, query, warehouse])
  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Stat icon={Boxes} label="Unidades disponibles" value={filtered.reduce((s, p) => s + p.stock, 0).toLocaleString("es-CO")} /><Stat icon={CircleDollarSign} label="Inventario valorizado" value={formatCOP(filtered.reduce((s, p) => s + p.stock * p.cost, 0))} /><Stat icon={AlertTriangle} label="Bajo mínimo" value={String(filtered.filter((p) => p.stock <= p.stockMin).length)} warning /><Stat icon={Warehouse} label="Bodegas activas" value={String(warehouses.filter((w) => w.active).length)} /></div>
    <Card><CardContent className="p-4"><div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar por referencia, artículo, SKU o marca..." value={query} onChange={(e) => setQuery(e.target.value)} /></div><Select value={warehouse} onValueChange={(v) => v && setWarehouse(v)}><SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todas las bodegas</SelectItem>{warehouses.filter((w) => w.active).map((w) => <SelectItem key={w.id} value={w.name}>{w.name}</SelectItem>)}</SelectContent></Select></div></CardContent></Card>
    <Card className="overflow-hidden"><div className="border-b px-4 py-3"><p className="font-semibold">Existencias por artículo</p><p className="text-xs text-muted-foreground">El maestro se administra desde Catálogo de artículos.</p></div><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Referencia</TableHead><TableHead>Artículo</TableHead><TableHead>Bodega</TableHead><TableHead className="text-right">Disponible</TableHead><TableHead className="text-right">Mínimo</TableHead><TableHead className="text-right">Máximo</TableHead><TableHead className="text-right">Costo</TableHead><TableHead className="text-right">Valor existencia</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader><TableBody>{filtered.map((p) => { const state = p.stock <= p.stockMin ? "Reponer" : p.stockMax > 0 && p.stock > p.stockMax ? "Exceso" : "Normal"; return <TableRow key={p.id}><TableCell className="font-mono font-bold">{p.reference}</TableCell><TableCell><p className="font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.sku} · {p.brand}</p></TableCell><TableCell>{p.warehouse}</TableCell><TableCell className="text-right text-lg font-bold">{p.stock}</TableCell><TableCell className="text-right">{p.stockMin}</TableCell><TableCell className="text-right">{p.stockMax}</TableCell><TableCell className="text-right">{formatCOP(p.cost)}</TableCell><TableCell className="text-right font-semibold">{formatCOP(p.stock * p.cost)}</TableCell><TableCell><Badge variant="secondary" className={state === "Reponer" ? "bg-rose-50 text-rose-700" : state === "Exceso" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}>{state}</Badge></TableCell></TableRow> })}</TableBody></Table></div></Card></div>
}
function Stat({ icon: Icon, label, value, warning }: { icon: typeof Boxes; label: string; value: string; warning?: boolean }) { return <Card><CardContent className="flex items-start justify-between p-4"><div><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-xl font-bold ${warning ? "text-amber-600" : ""}`}>{value}</p></div><span className="rounded-xl bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" /></span></CardContent></Card> }
