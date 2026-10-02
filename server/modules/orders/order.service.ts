import type { Prisma } from "@prisma/client"
import type { z } from "zod"
import { prisma } from "@/server/database/prisma"
import { orderRepository } from "@/server/modules/orders/order.repository"
import { createOrderSchema, orderFiltersSchema, updateOrderSchema } from "@/server/modules/orders/order.schema"
import { ApiError } from "@/server/shared/api-error"
import { paginationMeta } from "@/server/shared/pagination"
import { resolvePromotionPrices } from "@/server/modules/promotions/promotion-pricing"
import { sendOrderCreatedEmail, sendOrderUpdatedEmail } from "@/server/modules/orders/order-mailer"

type Order = NonNullable<Awaited<ReturnType<typeof orderRepository.find>>>
const n = (value: { toNumber(): number } | number) => typeof value === "number" ? value : value.toNumber()
const date = (value: Date | null) => value?.toISOString().slice(0, 10) ?? ""
export function orderToDto(order: Order) {
  return {
    id: order.id, customerId: order.customerId, guest: order.guest, customerName: order.customerName,
    document: order.document, email: order.email, phone: order.phone, createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({ productId: item.productId, sku: item.sku, reference: item.reference || item.sku, name: item.name, image: item.image, quantity: item.quantity, unitPrice: n(item.unitPrice), total: n(item.total) })),
    subtotal: n(order.subtotal), tax: n(order.tax), shippingCost: n(order.shippingCost), total: n(order.total),
    paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus, shippingMethod: order.shippingMethod,
    address: order.address, city: order.city, department: order.department, carrier: order.carrier,
    trackingNumber: order.trackingNumber, estimatedFrom: date(order.estimatedFrom), estimatedTo: date(order.estimatedTo),
    currentLocation: order.currentLocation, status: order.status,
    timeline: order.timeline.map((event) => ({ id: event.id, status: event.status, title: event.title, detail: event.detail, location: event.location, occurredAt: event.occurredAt.toISOString() })),
    inventoryApplied: order.inventoryApplied, inventoryRestored: order.inventoryRestored,
  }
}

export const orderService = {
  async listForCustomer(customerId: string, email: string) { return (await orderRepository.list({ OR: [{ customerId }, { email: { equals: email, mode: "insensitive" } }] }, 0, 100)).map(orderToDto) },
  async list(filters: z.infer<typeof orderFiltersSchema>) {
    const where: Prisma.OrderWhereInput = { ...(filters.status ? { status: filters.status } : {}), ...(filters.search ? { OR: [{ id: { contains: filters.search, mode: "insensitive" } }, { email: { contains: filters.search, mode: "insensitive" } }, { customerName: { contains: filters.search, mode: "insensitive" } }, { document: { contains: filters.search, mode: "insensitive" } }, { phone: { contains: filters.search, mode: "insensitive" } }, { city: { contains: filters.search, mode: "insensitive" } }, { carrier: { contains: filters.search, mode: "insensitive" } }, { trackingNumber: { contains: filters.search, mode: "insensitive" } }] } : {}) }
    const [orders, total] = await Promise.all([orderRepository.list(where, (filters.page - 1) * filters.limit, filters.limit), orderRepository.count(where)])
    return { data: orders.map(orderToDto), meta: paginationMeta(filters.page, filters.limit, total) }
  },
  async get(id: string) { const order = await orderRepository.find(id); if (!order) throw new ApiError(404, "ORDER_NOT_FOUND", "No fue posible encontrar el pedido"); return orderToDto(order) },
  async create(input: z.infer<typeof createOrderSchema>, customerId: string | null = null) {
    const id = `FE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
    await prisma.$transaction(async (tx) => {
      const lines = []
      let tax = 0
      for (const item of input.items) {
        const product = await tx.product.findFirst({ where: { OR: [{ id: item.productId }, { sku: item.productId }], active: true }, include: { images: { orderBy: { position: "asc" } }, priceTiers: true, promotion: true } })
        if (!product) throw new ApiError(404, "PRODUCT_NOT_FOUND", `Producto no disponible: ${item.productId}`)
        const result = await tx.product.updateMany({ where: { id: product.id, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } })
        if (!result.count) throw new ApiError(409, "INSUFFICIENT_STOCK", `No hay existencias suficientes de ${product.name}`)
        const tierPrices = Object.fromEntries(product.priceTiers.map((entry) => [entry.kind, n(entry.unitPrice)]))
        const basePrices = { unit: n(product.price), inner: tierPrices.inner ?? n(product.price), master: tierPrices.master ?? n(product.price) }
        const promotionPricing = resolvePromotionPrices(product.promotion, basePrices)
        const tier = [...product.priceTiers].filter((t) => item.quantity >= t.quantity).sort((a, b) => b.quantity - a.quantity)[0]
        const tierKind = tier?.kind === "inner" || tier?.kind === "master" ? tier.kind : "unit"
        const unitPrice = promotionPricing.active ? promotionPricing.prices[tierKind] : basePrices[tierKind]
        tax += Math.round(unitPrice * item.quantity * n(product.taxRate) / 100)
        lines.push({ productId: product.id, sku: product.sku, reference: product.reference, name: product.name, image: product.images[0]?.url ?? "/placeholder.svg", quantity: item.quantity, unitPrice, total: unitPrice * item.quantity })
        await tx.inventoryMovement.create({ data: { productId: product.id, quantity: -item.quantity, kind: "SALE", referenceId: id, warehouseName: "" } })
      }
      const subtotal = lines.reduce((sum, line) => sum + line.total, 0)
      const shipping = await tx.shippingConfiguration.findUnique({ where: { id: "default" }, include: { methods: true, zones: true } })
      const method = shipping?.methods.find((entry) => entry.id === (input.shippingMethod === "Express" ? "express" : "standard"))
      const zone = shipping?.zones.find((entry) => entry.active && entry.departments.some((name) => name.toLowerCase() === input.department.toLowerCase())) ?? shipping?.zones.find((entry) => entry.active && entry.departments.length === 0)
      if (!shipping?.enabled || !method?.active || !zone) throw new ApiError(422, "SHIPPING_UNAVAILABLE", "No hay envío disponible para el destino y método seleccionados")
      const quantity = lines.reduce((sum, line) => sum + line.quantity, 0)
      const free = shipping?.enabled && shipping.freeEnabled && method?.freeEligible && (shipping.freeMode === "all" ? (!shipping.freeByAmount || subtotal >= n(shipping.minimumAmount)) && (!shipping.freeByQuantity || quantity >= shipping.minimumQuantity) : (shipping.freeByAmount && subtotal >= n(shipping.minimumAmount)) || (shipping.freeByQuantity && quantity >= shipping.minimumQuantity))
      const shippingCost = free ? 0 : (method ? n(method.baseCost) : 0) + (zone ? n(zone.surcharge) : 0)
      const now = new Date()
      const eta = (days: number) => new Date(now.getTime() + days * 86400000)
      await tx.order.create({ data: { id, customerId, guest: !customerId, customerName: input.customerName, document: input.document, email: input.email, phone: input.phone, subtotal, tax, shippingCost, total: subtotal + tax + shippingCost, paymentMethod: input.paymentMethod, paymentStatus: input.paymentMethod === "Contra entrega" ? "Contra entrega" : "Pendiente", shippingMethod: input.shippingMethod, address: input.address, city: input.city, department: input.department, status: "Pedido confirmado", currentLocation: "Pedido recibido en TooList", estimatedFrom: eta(method.minDays), estimatedTo: eta(method.maxDays), inventoryApplied: true, items: { create: lines }, timeline: { create: [{ id: crypto.randomUUID(), status: "Pedido confirmado", title: "Pedido recibido", detail: "TooList recibió la compra y descontó las unidades del inventario.", location: "FERREIA · Bogotá", occurredAt: now }] } } })
    })
    const order = await this.get(id)
    if (order.paymentMethod === "Mercado Pago") return order
    const notification = await sendOrderCreatedEmail(order)
    return { ...order, notification }
  },
  async update(id: string, input: z.infer<typeof updateOrderSchema>) {
    const existing = await orderRepository.find(id)
    if (!existing) throw new ApiError(404, "ORDER_NOT_FOUND", "No fue posible encontrar el pedido")
    await prisma.$transaction(async (tx) => {
      const cancel = input.status === "Cancelado" && existing.status !== "Cancelado" && existing.inventoryApplied && !existing.inventoryRestored
      const timelineChanged = Boolean(input.detail || (input.status && input.status !== existing.status) || (input.currentLocation !== undefined && input.currentLocation !== existing.currentLocation))
      if (cancel) for (const item of existing.items) if (item.productId) { await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } }); await tx.inventoryMovement.create({ data: { productId: item.productId, quantity: item.quantity, kind: "CANCELLATION", referenceId: id, warehouseName: "" } }) }
      await tx.order.update({ where: { id }, data: { status: input.status, paymentStatus: cancel && existing.paymentStatus === "Pagado" ? "Reembolsado" : input.paymentStatus, carrier: input.carrier, trackingNumber: input.trackingNumber, currentLocation: input.currentLocation, estimatedFrom: input.estimatedFrom ? new Date(input.estimatedFrom) : undefined, estimatedTo: input.estimatedTo ? new Date(input.estimatedTo) : undefined, inventoryRestored: cancel ? true : existing.inventoryRestored, ...(timelineChanged ? { timeline: { create: { id: crypto.randomUUID(), status: input.status ?? existing.status, title: input.status ?? existing.status, detail: input.detail || `El pedido cambió al estado ${(input.status ?? existing.status).toLowerCase()}.`, location: input.currentLocation ?? existing.currentLocation, occurredAt: new Date() } } } : {}) } })
    })
    const order = await this.get(id)
    if (input.notifyCustomer === false) return order
    const notification = await sendOrderUpdatedEmail(order, input.detail ?? "")
    return { ...order, notification }
  },
}
