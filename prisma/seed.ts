import { PrismaClient } from "@prisma/client"
import { BRANDS, CATEGORIES, PRODUCTS, SUPPLIERS } from "../lib/data"
import { initialProductMaster, initialWarehouses } from "../lib/product-master"
import { initialPromotions } from "../lib/promotions"
import { INITIAL_ORDERS } from "../lib/orders"
import { initialShippingSettings } from "../lib/shipping"
import { initialMercadoPagoPayments } from "../lib/mercado-pago"
import { hashPassword } from "../server/shared/password"

const prisma = new PrismaClient()

function dateOnly(value: string) { return value ? new Date(`${value}T12:00:00.000Z`) : null }

async function main() {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({ where: { id: category.slug }, update: {}, create: { id: category.slug, slug: category.slug, name: category.name, icon: category.icon } })
  }
  for (const [index, name] of BRANDS.entries()) {
    await prisma.brand.upsert({ where: { name }, update: {}, create: { id: `BR-${String(index + 1).padStart(3, "0")}`, name } })
  }
  for (const supplier of SUPPLIERS) {
    await prisma.supplier.upsert({ where: { id: supplier.id }, update: {}, create: { id: supplier.id, name: supplier.nombre, nit: supplier.nit, contact: supplier.contacto, city: supplier.ciudad, balance: supplier.cartera } })
  }
  for (const warehouse of initialWarehouses) {
    await prisma.warehouse.upsert({ where: { id: warehouse.id }, update: {}, create: warehouse })
  }

  const lines = ["Herramientas eléctricas", "Herramientas manuales", "Ferretería", "Iluminación", "Pinturas", "Seguridad industrial", "Carpintería"]
  for (const [index, name] of lines.entries()) {
    const id = `LIN-${index + 1}`
    await prisma.productClassification.upsert({ where: { id }, update: {}, create: { id, kind: "LINE", name } })
  }
  const groups = [
    { id: "GRP-1", name: "Herramientas", parentId: "LIN-1" },
    { id: "GRP-2", name: "Accesorios y consumibles", parentId: "LIN-1" },
    { id: "GRP-3", name: "Elementos de fijación", parentId: "LIN-3" },
    { id: "GRP-4", name: "Luminarias", parentId: "LIN-4" },
  ]
  for (const group of groups) {
    await prisma.productClassification.upsert({ where: { id: group.id }, update: {}, create: { ...group, kind: "GROUP" } })
  }
  const subgroups = [
    { id: "SUB-1", name: "Taladros", parentId: "GRP-1" },
    { id: "SUB-2", name: "Sierras", parentId: "GRP-1" },
    { id: "SUB-3", name: "Tornillería", parentId: "GRP-3" },
    { id: "SUB-4", name: "Bombillos LED", parentId: "GRP-4" },
  ]
  for (const subgroup of subgroups) {
    await prisma.productClassification.upsert({ where: { id: subgroup.id }, update: {}, create: { ...subgroup, kind: "SUBGROUP" } })
  }

  const brands = await prisma.brand.findMany()
  const suppliers = await prisma.supplier.findMany()
  const warehouses = await prisma.warehouse.findMany()
  for (const storefront of PRODUCTS) {
    if (await prisma.product.findUnique({ where: { id: storefront.id }, select: { id: true } })) continue
    const master = initialProductMaster.find((item) => item.sku === storefront.sku)
    if (!master) continue
    await prisma.product.create({ data: {
      id: storefront.id, reference: master.reference, supplierReference: master.supplierReference,
      sku: storefront.sku, name: storefront.name, description: storefront.description,
      characteristics: master.characteristics, categoryId: storefront.category,
      subcategory: storefront.subcategory, line: master.line, group: master.group, subgroup: master.subgroup,
      brandId: brands.find((item) => item.name === storefront.brand)!.id,
      unit: master.unit, weight: master.weight, cost: master.cost, price: master.price,
      taxRate: master.taxRate, stock: master.stock, stockMin: master.stockMin, stockMax: master.stockMax,
      warehouseId: warehouses.find((item) => item.name === master.warehouse)?.id,
      packagingInner: master.packaging.inner, packagingMaster: master.packaging.master,
      markupPercent: master.markupPercent, active: master.active, rating: storefront.rating,
      reviews: storefront.reviews, badge: storefront.badge, power: storefront.power,
      size: storefront.size, material: storefront.material,
      images: { create: [storefront.image, ...master.images.filter((image) => image !== storefront.image)].map((url, position) => ({ url, position })) },
      barcodes: { create: master.barcodes.filter((item) => item.code).map((item) => ({ presentation: item.presentation, code: item.code })) },
      priceTiers: { create: Object.entries(storefront.priceTiers).map(([kind, tier]) => ({ kind, label: tier.label, quantity: tier.quantity, unitPrice: tier.unitPrice })) },
      specs: { create: storefront.specs.map((spec, position) => ({ ...spec, position })) },
      compatibilities: { create: storefront.compatibilities.map((value) => ({ value })) },
      suppliers: { create: master.suppliers.flatMap((name) => { const supplier = suppliers.find((item) => item.name === name); return supplier ? [{ supplierId: supplier.id }] : [] }) },
    } })
  }

  for (const promotion of initialPromotions) {
    const product = await prisma.product.findUnique({ where: { sku: promotion.sku }, select: { id: true } })
    if (!product) continue
    await prisma.promotion.upsert({ where: { productId: product.id }, update: {}, create: {
      productId: product.id, kind: promotion.kind, regularPrice: promotion.regularPrice, salePrice: promotion.salePrice, basePrice: promotion.basePrice,
      baseInnerPrice: promotion.basePrices.inner, baseMasterPrice: promotion.basePrices.master,
      unitEnabled: promotion.tiers.unit.enabled, unitDiscount: promotion.tiers.unit.percent,
      innerEnabled: promotion.tiers.inner.enabled, innerDiscount: promotion.tiers.inner.percent,
      masterEnabled: promotion.tiers.master.enabled, masterDiscount: promotion.tiers.master.percent,
      active: promotion.active,
    } })
  }

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    await prisma.customer.upsert({ where: { id: "ADM-001" }, update: {}, create: {
      id: "ADM-001", name: "Administrador FERREIA", document: "ADMIN-001",
      email: process.env.ADMIN_EMAIL.toLowerCase(), phone: "", role: "ADMIN",
      passwordHash: hashPassword(process.env.ADMIN_PASSWORD),
    } })
  }

  for (const order of INITIAL_ORDERS) {
    if (await prisma.order.findUnique({ where: { id: order.id }, select: { id: true } })) continue
    await prisma.order.create({ data: {
      id: order.id, guest: order.guest, customerName: order.customerName, document: order.document,
      email: order.email, phone: order.phone, subtotal: order.subtotal, tax: order.tax,
      shippingCost: order.shippingCost, total: order.total, paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus, shippingMethod: order.shippingMethod, address: order.address,
      city: order.city, department: order.department, carrier: order.carrier,
      trackingNumber: order.trackingNumber, estimatedFrom: dateOnly(order.estimatedFrom),
      estimatedTo: dateOnly(order.estimatedTo), currentLocation: order.currentLocation,
      status: order.status, inventoryApplied: order.inventoryApplied,
      inventoryRestored: order.inventoryRestored, createdAt: new Date(order.createdAt),
      items: { create: order.items.map((item) => ({ productId: item.productId, sku: item.sku, reference: item.reference, name: item.name, image: item.image, quantity: item.quantity, unitPrice: item.unitPrice, total: item.total })) },
      timeline: { create: order.timeline.map((item) => ({ ...item, occurredAt: new Date(item.occurredAt) })) },
    } })
  }

  const shipping = initialShippingSettings
  await prisma.shippingConfiguration.upsert({ where: { id: "default" }, update: {}, create: {
    id: "default", enabled: shipping.enabled, freeEnabled: shipping.freeShipping.enabled,
    freeByAmount: shipping.freeShipping.byAmount, minimumAmount: shipping.freeShipping.minimumAmount,
    freeByQuantity: shipping.freeShipping.byQuantity, minimumQuantity: shipping.freeShipping.minimumQuantity,
    freeMode: shipping.freeShipping.mode,
    methods: { create: [
      { id: "standard", active: shipping.standard.active, baseCost: shipping.standard.baseCost, minDays: shipping.standard.minDays, maxDays: shipping.standard.maxDays, freeEligible: shipping.standard.freeShippingEligible },
      { id: "express", active: shipping.express.active, baseCost: shipping.express.baseCost, minDays: shipping.express.minDays, maxDays: shipping.express.maxDays, freeEligible: shipping.express.freeShippingEligible },
    ] },
    zones: { create: shipping.zones.map((zone) => ({ ...zone })) },
  } })

  const existingOrderIds = new Set((await prisma.order.findMany({ select: { id: true } })).map((order) => order.id))
  for (const payment of initialMercadoPagoPayments) {
    await prisma.payment.upsert({ where: { id: payment.id }, update: {}, create: {
      id: payment.id, orderId: existingOrderIds.has(payment.orderId) ? payment.orderId : null,
      externalReference: payment.externalReference, status: payment.status, statusDetail: payment.statusDetail,
      amount: payment.amount, refundedAmount: payment.refundedAmount, marketplaceFee: payment.marketplaceFee,
      financingFee: payment.financingFee, taxOnFee: payment.taxOnFee, netReceived: payment.netReceived,
      paymentMethod: payment.paymentMethod, paymentType: payment.paymentType, installments: payment.installments,
      cardLastFour: payment.cardLastFour, statementDescriptor: payment.statementDescriptor,
      operationType: payment.operationType, moneyReleaseDate: payment.moneyReleaseDate ? dateOnly(payment.moneyReleaseDate) : null,
      liveMode: payment.liveMode, customerName: payment.customer.name, customerEmail: payment.customer.email,
      customerDocument: payment.customer.document, webhookLastEvent: payment.webhook.lastEvent,
      webhookReceivedAt: new Date(payment.webhook.receivedAt), webhookValid: payment.webhook.signatureValid,
      createdAt: new Date(payment.createdAt), approvedAt: payment.approvedAt ? new Date(payment.approvedAt) : null,
    } })
  }
  console.log("Seed FERREIA completado")
}

main().catch((error) => { console.error("Seed FERREIA falló:", error); process.exitCode = 1 }).finally(async () => prisma.$disconnect())
