import { prisma } from "@/server/database/prisma"

export const reportRepository = {
  sales() {
    return prisma.order.findMany({
      where: { status: { not: "Cancelado" } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, customerName: true, createdAt: true, status: true,
        subtotal: true, tax: true, shippingCost: true, total: true,
        items: { select: { quantity: true, total: true, product: { select: { cost: true, category: { select: { name: true } } } } } },
      },
    })
  },
  purchases() {
    return prisma.purchaseOrder.findMany({
      orderBy: { date: "desc" },
      select: {
        id: true, supplierName: true, date: true, status: true, quotedTotal: true,
        invoice: { select: { number: true, freight: true, lines: { select: { receivedQty: true, invoiceUnitCost: true } } } },
      },
    })
  },
  inventory() {
    return prisma.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: {
        id: true, reference: true, sku: true, name: true, stock: true, stockMin: true,
        cost: true, category: { select: { name: true } }, warehouse: { select: { name: true } },
      },
    })
  },
}
