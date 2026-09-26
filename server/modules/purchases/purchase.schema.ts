import { z } from "zod"
import { paginationSchema } from "@/server/shared/pagination"
export const purchaseFiltersSchema = paginationSchema.extend({ status: z.string().optional(), search: z.string().max(120).optional() })
const line = z.object({ sku: z.string().min(1), orderedQty: z.number().int().positive(), quotedUnitCost: z.number().nonnegative() })
export const savePurchaseSchema = z.object({ id: z.string().min(1).max(80).optional(), supplierId: z.string().trim().min(1), date: z.iso.date(), status: z.enum(["Borrador", "Enviada"]), lines: z.array(line).min(1) }).strict()
export const approveInvoiceSchema = z.object({ number: z.string().trim().min(1).max(100), date: z.iso.date(), freight: z.number().nonnegative(), lines: z.array(z.object({ sku: z.string().min(1), receivedQty: z.number().int().nonnegative(), invoiceUnitCost: z.number().nonnegative(), updateSalePrice: z.boolean(), salePrice: z.number().nonnegative() })).min(1) }).strict()
