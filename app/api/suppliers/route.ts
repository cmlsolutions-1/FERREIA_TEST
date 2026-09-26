import { requireAdmin } from "@/server/modules/auth/auth.service"
import { supplierService } from "@/server/modules/suppliers/supplier.service"
import { createSupplierSchema, supplierFiltersSchema } from "@/server/modules/suppliers/supplier.schema"
import { handleApi, success } from "@/server/shared/api-response"
import { parseBody, parseSearch } from "@/server/shared/validation"

export const runtime = "nodejs"
export async function GET(request: Request) { return handleApi(async () => { await requireAdmin(request); const result = await supplierService.list(parseSearch(request, supplierFiltersSchema)); return success("Proveedores obtenidos correctamente", result.data, 200, result.meta) }) }
export async function POST(request: Request) { return handleApi(async () => { await requireAdmin(request); const data = await supplierService.create(await parseBody(request, createSupplierSchema)); return success("Proveedor creado correctamente", data, 201) }) }
