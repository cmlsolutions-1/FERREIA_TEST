import { initialProductMaster } from "@/lib/product-master"

export const PURCHASE_ORDERS_KEY = "ferreia-admin-purchase-orders-v2"
export const LEGACY_PURCHASE_ORDERS_KEY = "ferreia-admin-purchase-orders"

export type PurchaseOrderLine = {
  productId: string
  sku: string
  name: string
  orderedQty: number
  quotedUnitCost: number
}

export type InvoiceLine = {
  productId: string
  receivedQty: number
  invoiceUnitCost: number
  freightShare: number
  landedUnitCost: number
  updateSalePrice: boolean
  salePrice: number
}

export type PurchaseOrder = {
  id: string
  supplier: string
  date: string
  status: "Borrador" | "Enviada" | "Recibida"
  lines: PurchaseOrderLine[]
  invoice?: {
    number: string
    date: string
    freight: number
    approvedAt: string
    lines: InvoiceLine[]
  }
}

export const initialPurchaseOrders: PurchaseOrder[] = [{
  id: "OC-2042",
  supplier: "Distribuidora Bosch Colombia",
  date: "2026-09-15",
  status: "Enviada",
  lines: [
    { productId: initialProductMaster[1].id, sku: initialProductMaster[1].sku, name: initialProductMaster[1].name, orderedQty: 8, quotedUnitCost: initialProductMaster[1].cost },
    { productId: initialProductMaster[2].id, sku: initialProductMaster[2].sku, name: initialProductMaster[2].name, orderedQty: 24, quotedUnitCost: initialProductMaster[2].cost },
  ],
}]

export function allocateFreight(lines: Array<{ receivedQty: number; invoiceUnitCost: number }>, freight: number) {
  const bases = lines.map((line) => line.receivedQty * line.invoiceUnitCost)
  const total = bases.reduce((sum, value) => sum + value, 0)
  let allocated = 0
  return bases.map((base, index) => {
    if (!base || !total) return 0
    const remaining = bases.slice(index + 1).some((value) => value > 0)
    const share = remaining ? Math.round((freight * base / total) * 100) / 100 : freight - allocated
    allocated += share
    return share
  })
}
