import type { Prisma } from "@prisma/client"
import type { z } from "zod"
import { prisma } from "@/server/database/prisma"
import { purchaseRepository } from "@/server/modules/purchases/purchase.repository"
import { purchaseFiltersSchema, savePurchaseSchema, approveInvoiceSchema } from "@/server/modules/purchases/purchase.schema"
import { ApiError } from "@/server/shared/api-error"
import { paginationMeta } from "@/server/shared/pagination"

type Purchase = NonNullable<Awaited<ReturnType<typeof purchaseRepository.find>>>
const money = (value: { toNumber(): number }) => value.toNumber()
function dto(order: Purchase) { return { id: order.id, supplierId: order.supplierId, supplier: order.supplierName, date: order.date.toISOString().slice(0, 10), status: order.status, quotedTotal: money(order.quotedTotal), lines: order.lines.map((line) => ({ productId: line.sku, sku: line.sku, name: line.name, orderedQty: line.orderedQty, quotedUnitCost: money(line.quotedUnitCost) })), invoice: order.invoice ? { number: order.invoice.number, date: order.invoice.date.toISOString().slice(0, 10), freight: money(order.invoice.freight), approvedAt: order.invoice.approvedAt.toISOString(), lines: order.invoice.lines.map((line) => ({ productId: order.lines.find((item) => item.productId === line.productId)?.sku ?? line.productId ?? "", receivedQty: line.receivedQty, invoiceUnitCost: money(line.invoiceUnitCost), freightShare: money(line.freightShare), landedUnitCost: money(line.landedUnitCost), updateSalePrice: line.updateSalePrice, salePrice: money(line.salePrice) })) } : undefined } }
export const purchaseService = {
  async list(filters: z.infer<typeof purchaseFiltersSchema>) { const where: Prisma.PurchaseOrderWhereInput = { ...(filters.status ? { status: filters.status } : {}), ...(filters.search ? { OR: [{ id: { contains: filters.search, mode: "insensitive" } }, { supplierName: { contains: filters.search, mode: "insensitive" } }] } : {}) }; const [orders, total] = await Promise.all([purchaseRepository.list(where, (filters.page - 1) * filters.limit, filters.limit), purchaseRepository.count(where)]); return { data: orders.map(dto), meta: paginationMeta(filters.page, filters.limit, total) } },
  async get(id: string) { const order = await purchaseRepository.find(id); if (!order) throw new ApiError(404, "PURCHASE_ORDER_NOT_FOUND", "No fue posible encontrar la orden de compra"); return dto(order) },
  async save(input: z.infer<typeof savePurchaseSchema>, id?: string) {
    const orderId = id ?? input.id ?? `OC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
    const existing = id ? await purchaseRepository.find(id) : null
    if (id && !existing) throw new ApiError(404, "PURCHASE_ORDER_NOT_FOUND", "No fue posible encontrar la orden de compra")
    if (existing && existing.status !== "Borrador") throw new ApiError(409, "PURCHASE_ORDER_LOCKED", "La orden enviada ya no se puede modificar")
    const supplier = await prisma.supplier.findUnique({ where: { id: input.supplierId } })
    if (!supplier || !supplier.active) throw new ApiError(422, "INVALID_SUPPLIER", "Selecciona un proveedor activo")
    await prisma.$transaction(async (tx) => {
      const lines = []
      for (const item of input.lines) { const product = await tx.product.findUnique({ where: { sku: item.sku } }); if (!product) throw new ApiError(404, "PRODUCT_NOT_FOUND", `Producto no encontrado: ${item.sku}`); lines.push({ productId: product.id, sku: product.sku, name: product.name, orderedQty: item.orderedQty, quotedUnitCost: item.quotedUnitCost }) }
      const quotedTotal = lines.reduce((sum, line) => sum + line.orderedQty * line.quotedUnitCost, 0)
      if (existing) { await tx.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: orderId } }); await tx.purchaseOrder.update({ where: { id: orderId }, data: { supplierId: supplier.id, supplierName: supplier.name, date: new Date(input.date), status: input.status, quotedTotal, lines: { create: lines } } }) }
      else await tx.purchaseOrder.create({ data: { id: orderId, supplierId: supplier.id, supplierName: supplier.name, date: new Date(input.date), status: input.status, quotedTotal, lines: { create: lines } } })
    })
    return this.get(orderId)
  },
  async approve(id: string, input: z.infer<typeof approveInvoiceSchema>) {
    const order = await purchaseRepository.find(id)
    if (!order) throw new ApiError(404, "PURCHASE_ORDER_NOT_FOUND", "No fue posible encontrar la orden de compra")
    if (order.status !== "Enviada" || order.invoice) throw new ApiError(409, "PURCHASE_ORDER_LOCKED", "La orden no está pendiente de recepción")
    if (!input.lines.some((line) => line.receivedQty > 0)) throw new ApiError(422, "INVALID_RECEIPT", "La factura debe recibir al menos una unidad")
    if (new Set(input.lines.map((line) => line.sku)).size !== input.lines.length) throw new ApiError(422, "INVALID_RECEIPT", "La factura contiene artículos repetidos")
    if (input.lines.some((line) => line.receivedQty > 0 && line.invoiceUnitCost <= 0 || line.updateSalePrice && line.salePrice <= 0)) throw new ApiError(422, "INVALID_RECEIPT", "Los costos y precios recibidos deben ser mayores a cero")
    const duplicate = await prisma.purchaseInvoice.findFirst({ where: { number: input.number } })
    if (duplicate) throw new ApiError(409, "DUPLICATE_RECORD", "La factura ya está registrada")
    const bases = input.lines.map((line) => line.receivedQty * line.invoiceUnitCost)
    const totalBase = bases.reduce((sum, value) => sum + value, 0)
    if (totalBase <= 0) throw new ApiError(422, "INVALID_RECEIPT", "El costo de la factura debe ser mayor a cero")
    let allocated = 0
    const lastPositive = bases.findLastIndex((value) => value > 0)
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.purchaseOrder.updateMany({ where: { id, status: "Enviada" }, data: { status: "Recibida" } })
      if (!claimed.count) throw new ApiError(409, "PURCHASE_ORDER_LOCKED", "La orden ya fue recibida")
      const invoiceLines = []
      for (const [index, line] of input.lines.entries()) {
        const ordered = order.lines.find((item) => item.sku === line.sku)
        if (!ordered?.productId) throw new ApiError(422, "INVALID_RECEIPT", `El artículo ${line.sku} no pertenece a la orden`)
        const last = index === lastPositive
        const share = !bases[index] ? 0 : last ? input.freight - allocated : Math.round(input.freight * bases[index] / totalBase * 100) / 100
        allocated += share
        const landedUnitCost = line.receivedQty ? Math.round((line.invoiceUnitCost + share / line.receivedQty) * 100) / 100 : 0
        invoiceLines.push({ productId: ordered.productId, receivedQty: line.receivedQty, invoiceUnitCost: line.invoiceUnitCost, freightShare: share, landedUnitCost, updateSalePrice: line.updateSalePrice, salePrice: line.salePrice })
        if (!line.receivedQty) continue
        const product = await tx.product.findUnique({ where: { id: ordered.productId } })
        if (!product) throw new ApiError(404, "PRODUCT_NOT_FOUND", `Producto no encontrado: ${line.sku}`)
        const changed = product.cost.toNumber() !== landedUnitCost
        await tx.product.update({ where: { id: product.id }, data: { stock: { increment: line.receivedQty }, cost: landedUnitCost, ...(line.updateSalePrice ? { price: line.salePrice, markupPercent: landedUnitCost > 0 ? ((line.salePrice / landedUnitCost) - 1) * 100 : null } : {}), ...(changed ? { costReview: { upsert: { create: { previousCost: product.cost, newCost: landedUnitCost, purchaseOrderId: id, invoiceNumber: input.number, changedAt: new Date(), pending: !line.updateSalePrice }, update: { previousCost: product.cost, newCost: landedUnitCost, purchaseOrderId: id, invoiceNumber: input.number, changedAt: new Date(), pending: !line.updateSalePrice } } } } : {}) } })
        await tx.inventoryMovement.create({ data: { productId: product.id, quantity: line.receivedQty, kind: "PURCHASE_RECEIPT", referenceId: id, warehouseName: "" } })
      }
      await tx.purchaseInvoice.create({ data: { purchaseOrderId: id, number: input.number, date: new Date(input.date), freight: input.freight, approvedAt: new Date(), lines: { create: invoiceLines } } })
    })
    return this.get(id)
  },
}
