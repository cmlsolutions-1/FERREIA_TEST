import { requireAdmin } from "@/server/modules/auth/auth.service"
import { supplierService } from "@/server/modules/suppliers/supplier.service"
import { handleApi, success } from "@/server/shared/api-response"

export const runtime = "nodejs"
export async function GET(request: Request) { return handleApi(async () => { await requireAdmin(request); return success("Resumen de proveedores obtenido correctamente", await supplierService.summary()) }) }
