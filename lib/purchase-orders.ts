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
  supplierId?: string | null
  supplier: string
  date: string
  status: "Borrador" | "Enviada" | "Recibida"
  quotedTotal?: number
  lines: PurchaseOrderLine[]
  invoice?: {
    number: string
    date: string
    freight: number
    approvedAt: string
    lines: InvoiceLine[]
  }
}

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
