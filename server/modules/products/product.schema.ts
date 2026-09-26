import { z } from "zod"
import { paginationSchema } from "@/server/shared/pagination"

const money = z.number().finite().nonnegative().max(1_000_000_000)
const barcodeSchema = z.object({ presentation: z.enum(["Unidad", "Inner", "Master", "Alterno"]), code: z.string().trim().min(1).max(100) })
const tierSchema = z.object({ kind: z.enum(["unit", "inner", "master"]), label: z.string().trim().min(1), quantity: z.number().int().positive(), unitPrice: money })

export const productFiltersSchema = paginationSchema.extend({
  search: z.string().trim().max(120).optional(), category: z.string().trim().max(120).optional(),
  brand: z.string().trim().max(120).optional(), minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(), active: z.enum(["true", "false"]).optional(),
  featured: z.enum(["true", "false"]).optional(), sort: z.enum(["name", "price-asc", "price-desc", "newest", "stock"]).default("name"),
  admin: z.enum(["true"]).optional(),
}).refine((value) => value.minPrice === undefined || value.maxPrice === undefined || value.minPrice <= value.maxPrice, "El precio mínimo no puede superar al máximo")

export const createProductSchema = z.object({
  id: z.string().trim().min(1).max(128).optional(), reference: z.string().trim().min(1).max(50),
  supplierReference: z.string().trim().max(100).default(""), sku: z.string().trim().min(1).max(100),
  name: z.string().trim().min(2).max(250), description: z.string().default(""), characteristics: z.string().default(""),
  categoryId: z.string().trim().min(1), subcategory: z.string().default(""),
  line: z.string().default(""), group: z.string().default(""), subgroup: z.string().default(""),
  brandId: z.string().trim().min(1), warehouseId: z.string().nullable().optional(),
  unit: z.string().default("Unidad"), weight: z.number().nonnegative().default(0),
  cost: money.default(0), price: money.positive(), taxRate: z.number().min(0).max(100).default(19),
  stock: z.number().int().nonnegative().default(0), stockMin: z.number().int().nonnegative().default(0),
  stockMax: z.number().int().nonnegative().default(0), packagingInner: z.number().int().positive().default(1),
  packagingMaster: z.number().int().positive().default(1), markupPercent: z.number().nullable().optional(),
  active: z.boolean().default(true), rating: z.number().min(0).max(5).default(0),
  reviews: z.number().int().nonnegative().default(0), badge: z.string().nullable().optional(),
  power: z.string().nullable().optional(), size: z.string().nullable().optional(), material: z.string().nullable().optional(),
  images: z.array(z.string().trim().min(1)).max(10).default([]),
  barcodes: z.array(barcodeSchema).default([]), priceTiers: z.array(tierSchema).default([]),
  specs: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
  compatibilities: z.array(z.string()).default([]), supplierIds: z.array(z.string()).default([]),
}).strict()

export const updateProductSchema = createProductSchema.partial().extend({ costReviewPending: z.boolean().optional() }).refine((value) => Object.keys(value).length > 0, "Envía al menos un campo")
