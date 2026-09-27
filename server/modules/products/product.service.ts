import type { Prisma } from "@prisma/client"
import type { z } from "zod"
import { productRepository } from "@/server/modules/products/product.repository"
import { createProductSchema, productFiltersSchema, updateProductSchema } from "@/server/modules/products/product.schema"
import { ApiError } from "@/server/shared/api-error"
import { paginationMeta } from "@/server/shared/pagination"

type Filters = z.infer<typeof productFiltersSchema>
type Create = z.infer<typeof createProductSchema>
type Update = z.infer<typeof updateProductSchema>
type Record = NonNullable<Awaited<ReturnType<typeof productRepository.find>>>
const number = (value: { toNumber(): number } | number) => typeof value === "number" ? value : value.toNumber()

export function productToDto(product: Record) {
  const promotion = product.promotion
  const today = new Date()
  const validPromotion = promotion && promotion.active && number(promotion.basePrice) === number(product.price) && number(promotion.salePrice) > 0 && number(promotion.salePrice) < number(promotion.regularPrice) && (!promotion.startsAt || promotion.startsAt <= today) && (!promotion.endsAt || promotion.endsAt >= today)
  const price = validPromotion ? number(promotion.salePrice) : number(product.price)
  const storedTiers = Object.fromEntries(product.priceTiers.map((tier) => [tier.kind, { label: tier.label, quantity: tier.quantity, unitPrice: number(tier.unitPrice) }]))
  const tiers = {
    unit: storedTiers.unit ? { ...storedTiers.unit, quantity: 1, unitPrice: price } : { label: "Unidad", quantity: 1, unitPrice: price },
    inner: storedTiers.inner ?? { label: "Caja inner", quantity: product.packagingInner, unitPrice: price },
    master: storedTiers.master ?? { label: "Caja master", quantity: product.packagingMaster, unitPrice: price },
  }
  return {
    id: product.id, reference: product.reference, supplierReference: product.supplierReference,
    sku: product.sku, name: product.name, description: product.description, characteristics: product.characteristics,
    category: product.category.slug, categoryName: product.category.name, subcategory: product.subcategory,
    line: product.line, group: product.group, subgroup: product.subgroup, brand: product.brand.name,
    brandId: product.brandId, warehouse: product.warehouse?.name ?? "", warehouseId: product.warehouseId,
    unit: product.unit, weight: number(product.weight), cost: number(product.cost), basePrice: number(product.price),
    price, oldPrice: validPromotion ? number(promotion.regularPrice) : undefined, taxRate: number(product.taxRate),
    stock: product.stock, stockMin: product.stockMin, stockMax: product.stockMax,
    packaging: { inner: tiers.inner.quantity, master: tiers.master.quantity },
    markupPercent: product.markupPercent ? number(product.markupPercent) : undefined,
    active: product.active, rating: product.rating, reviews: product.reviews,
    badge: validPromotion ? promotion.kind === "outlet" ? "Outlet" : "Oferta" : product.badge,
    power: product.power ?? undefined, size: product.size ?? undefined, material: product.material ?? undefined,
    image: product.images[0]?.url ?? "/placeholder.svg", images: product.images.map((image) => image.url),
    barcodes: product.barcodes.map((barcode) => ({ presentation: barcode.presentation, code: barcode.code })),
    barcode: product.barcodes.find((barcode) => barcode.presentation === "Unidad")?.code ?? product.barcodes[0]?.code ?? "",
    priceTiers: tiers, specs: product.specs.map(({ label, value }) => ({ label, value })),
    compatibilities: product.compatibilities.map((item) => item.value),
    suppliers: product.suppliers.map((item) => item.supplier.name),
    costReview: product.costReview ? { previousCost: number(product.costReview.previousCost), newCost: number(product.costReview.newCost), purchaseOrderId: product.costReview.purchaseOrderId, invoiceNumber: product.costReview.invoiceNumber, changedAt: product.costReview.changedAt.toISOString(), pending: product.costReview.pending } : undefined,
    createdAt: product.createdAt.toISOString(), updatedAt: product.updatedAt.toISOString(),
  }
}

export function publicProduct(dto: ReturnType<typeof productToDto>) {
  const { cost, markupPercent, costReview, supplierReference, suppliers, warehouse, warehouseId, stockMin, stockMax, weight, ...publicFields } = dto
  void cost; void markupPercent; void costReview; void supplierReference; void suppliers; void warehouse; void warehouseId; void stockMin; void stockMax; void weight
  return publicFields
}

function nested(input: Create | Update, replace: boolean) {
  const removal = replace ? { deleteMany: {} } : {}
  return {
    ...(input.images ? { images: { ...removal, create: input.images.map((url, position) => ({ url, position })) } } : {}),
    ...(input.barcodes ? { barcodes: { ...removal, create: input.barcodes } } : {}),
    ...(input.priceTiers ? { priceTiers: { ...removal, create: input.priceTiers } } : {}),
    ...(input.specs ? { specs: { ...removal, create: input.specs.map((spec, position) => ({ ...spec, position })) } } : {}),
    ...(input.compatibilities ? { compatibilities: { ...removal, create: input.compatibilities.map((value) => ({ value })) } } : {}),
    ...(input.supplierIds ? { suppliers: { ...removal, create: input.supplierIds.map((supplierId) => ({ supplierId })) } } : {}),
  }
}

function scalars(input: Create | Update) {
  const { images, barcodes, priceTiers, specs, compatibilities, supplierIds, ...rest } = input
  void images; void barcodes; void specs; void compatibilities; void supplierIds
  const { costReviewPending, ...values } = rest as typeof rest & { costReviewPending?: boolean }
  void costReviewPending
  const inner = priceTiers?.find((tier) => tier.kind === "inner")
  const master = priceTiers?.find((tier) => tier.kind === "master")
  return { ...values, ...(inner ? { packagingInner: inner.quantity } : {}), ...(master ? { packagingMaster: master.quantity } : {}) }
}

export const productService = {
  async list(filters: Filters) {
    const where: Prisma.ProductWhereInput = {
      ...(filters.active ? { active: filters.active === "true" } : {}),
      ...(filters.category ? { category: { slug: filters.category } } : {}),
      ...(filters.brand ? { brand: { name: { equals: filters.brand, mode: "insensitive" } } } : {}),
      ...(filters.minPrice !== undefined || filters.maxPrice !== undefined ? { price: { gte: filters.minPrice, lte: filters.maxPrice } } : {}),
      ...(filters.featured ? { badge: filters.featured === "true" ? { not: null } : null } : {}),
      ...(filters.search ? { OR: [
        { name: { contains: filters.search, mode: "insensitive" } }, { sku: { contains: filters.search, mode: "insensitive" } },
        { reference: { contains: filters.search, mode: "insensitive" } }, { barcodes: { some: { code: { contains: filters.search, mode: "insensitive" } } } },
      ] } : {}),
    }
    const orderBy: Prisma.ProductOrderByWithRelationInput = filters.sort === "price-asc" ? { price: "asc" } : filters.sort === "price-desc" ? { price: "desc" } : filters.sort === "newest" ? { createdAt: "desc" } : filters.sort === "stock" ? { stock: "desc" } : { name: "asc" }
    const [products, total] = await Promise.all([productRepository.list(where, (filters.page - 1) * filters.limit, filters.limit, orderBy), productRepository.count(where)])
    return { data: products.map(productToDto), meta: paginationMeta(filters.page, filters.limit, total) }
  },
  async get(id: string) { const product = await productRepository.find(id); if (!product) throw new ApiError(404, "PRODUCT_NOT_FOUND", "No fue posible encontrar el producto"); return productToDto(product) },
  async create(input: Create) {
    const data = { ...scalars(input), id: input.id ?? `p-${crypto.randomUUID()}`, ...nested(input, false) } as Prisma.ProductUncheckedCreateInput
    return productToDto(await productRepository.create(data))
  },
  async update(id: string, input: Update) {
    const existing = await productRepository.find(id)
    if (!existing) throw new ApiError(404, "PRODUCT_NOT_FOUND", "No fue posible encontrar el producto")
    const data = { ...scalars(input), ...nested(input, true), ...(input.costReviewPending !== undefined && existing.costReview ? { costReview: { update: { pending: input.costReviewPending } } } : {}) } as Prisma.ProductUncheckedUpdateInput
    return productToDto(await productRepository.update(existing.id, data))
  },
  async remove(id: string) { const existing = await productRepository.find(id); if (!existing) throw new ApiError(404, "PRODUCT_NOT_FOUND", "No fue posible encontrar el producto"); await productRepository.update(existing.id, { active: false }) },
}
