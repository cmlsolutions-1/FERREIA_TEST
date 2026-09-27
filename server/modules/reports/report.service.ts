import { reportRepository } from "@/server/modules/reports/report.repository"

const amount = (value: { toNumber(): number } | number) => typeof value === "number" ? value : value.toNumber()
const monthKey = (date: Date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
const monthLabel = (date: Date) => new Intl.DateTimeFormat("es-CO", { month: "short", timeZone: "UTC" }).format(date).replace(".", "")

function recentMonths(count: number) {
  const now = new Date()
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (count - index - 1), 1))
    return { key: monthKey(date), label: monthLabel(date) }
  })
}

function purchaseTotal(purchase: Awaited<ReturnType<typeof reportRepository.purchases>>[number]) {
  if (!purchase.invoice) return amount(purchase.quotedTotal)
  return amount(purchase.invoice.freight) + purchase.invoice.lines.reduce((sum, line) => sum + line.receivedQty * amount(line.invoiceUnitCost), 0)
}

function csvCell(value: string | number) {
  const clean = String(value).replaceAll('"', '""')
  return /[",\n]/.test(clean) ? `"${clean}"` : clean
}

function csv(rows: Array<Array<string | number>>) {
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`
}

export const reportService = {
  async summary() {
    const [sales, purchases, inventory] = await Promise.all([reportRepository.sales(), reportRepository.purchases(), reportRepository.inventory()])
    const netSales = sales.reduce((sum, order) => sum + amount(order.total), 0)
    const registeredPurchases = purchases.reduce((sum, purchase) => sum + purchaseTotal(purchase), 0)
    const estimatedMargin = sales.reduce((sum, order) => sum + order.items.reduce((lineSum, item) => lineSum + amount(item.total) - item.quantity * (item.product ? amount(item.product.cost) : 0), 0), 0)
    const lowStock = inventory
      .filter((product) => product.stock <= product.stockMin)
      .sort((a, b) => (a.stock - a.stockMin) - (b.stock - b.stockMin))
      .map((product) => ({ id: product.id, sku: product.sku, name: product.name, stock: product.stock, stockMin: product.stockMin }))

    const months = recentMonths(6)
    const monthly = months.map((month) => ({
      month: month.label,
      key: month.key,
      sales: sales.filter((order) => monthKey(order.createdAt) === month.key).reduce((sum, order) => sum + amount(order.total), 0),
      purchases: purchases.filter((purchase) => monthKey(purchase.date) === month.key).reduce((sum, purchase) => sum + purchaseTotal(purchase), 0),
    }))

    const categoryAmounts = new Map<string, number>()
    for (const order of sales) for (const item of order.items) {
      const category = item.product?.category.name ?? "Sin categoría"
      categoryAmounts.set(category, (categoryAmounts.get(category) ?? 0) + amount(item.total))
    }
    const categoryTotal = [...categoryAmounts.values()].reduce((sum, value) => sum + value, 0)
    const ranked = [...categoryAmounts.entries()].sort((a, b) => b[1] - a[1])
    const top = ranked.slice(0, 4)
    const other = ranked.slice(4).reduce((sum, [, value]) => sum + value, 0)
    const categories = [...top, ...(other ? [["Otros", other] as [string, number]] : [])]
      .map(([name, value]) => ({ name, value, percentage: categoryTotal ? Math.round(value / categoryTotal * 1000) / 10 : 0 }))
    const bestMonth = [...monthly].sort((a, b) => b.sales - a.sales)[0]

    return {
      totals: { netSales, registeredPurchases, estimatedMargin, lowStockProducts: lowStock.length },
      monthly,
      categories,
      lowStock: lowStock.slice(0, 3),
      insights: {
        bestMonth: bestMonth?.sales ? bestMonth.month : "Sin ventas",
        leadingCategory: categories[0]?.name ?? "Sin ventas",
      },
      marginBasis: "Costo actual de los productos asociados a cada línea vendida",
    }
  },
  async export(kind: "summary" | "sales" | "inventory" | "purchases") {
    if (kind === "summary") {
      const summary = await this.summary()
      return csv([
        ["Indicador", "Valor"],
        ["Ventas netas", summary.totals.netSales],
        ["Compras registradas", summary.totals.registeredPurchases],
        ["Margen estimado", summary.totals.estimatedMargin],
        ["Alertas de stock", summary.totals.lowStockProducts],
        ["Base del margen", summary.marginBasis],
      ])
    }
    if (kind === "sales") {
      const sales = await reportRepository.sales()
      return csv([["Pedido", "Fecha", "Cliente", "Estado", "Subtotal", "Impuesto", "Envío", "Total"], ...sales.map((order) => [order.id, order.createdAt.toISOString(), order.customerName, order.status, amount(order.subtotal), amount(order.tax), amount(order.shippingCost), amount(order.total)])])
    }
    if (kind === "inventory") {
      const inventory = await reportRepository.inventory()
      return csv([["Referencia", "SKU", "Artículo", "Categoría", "Bodega", "Existencia", "Mínimo", "Costo", "Valor inventario"], ...inventory.map((product) => [product.reference, product.sku, product.name, product.category.name, product.warehouse?.name ?? "Sin bodega", product.stock, product.stockMin, amount(product.cost), product.stock * amount(product.cost)])])
    }
    const purchases = await reportRepository.purchases()
    return csv([["Orden", "Fecha", "Proveedor", "Estado", "Total cotizado", "Factura", "Total registrado"], ...purchases.map((purchase) => [purchase.id, purchase.date.toISOString(), purchase.supplierName, purchase.status, amount(purchase.quotedTotal), purchase.invoice?.number ?? "", purchaseTotal(purchase)])])
  },
}
