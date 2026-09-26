import { shippingService } from "@/server/modules/shipping/shipping.service"
import { shippingSchema } from "@/server/modules/shipping/shipping.schema"
import { requireAdmin } from "@/server/modules/auth/auth.service"
import { handleApi, success } from "@/server/shared/api-response"
import { parseBody } from "@/server/shared/validation"
export const runtime = "nodejs"
export async function GET() { return handleApi(async () => success("Configuración de envíos obtenida correctamente", await shippingService.get())) }
export async function PUT(request: Request) { return handleApi(async () => { await requireAdmin(request); return success("Configuración de envíos guardada correctamente", await shippingService.save(await parseBody(request, shippingSchema))) }) }
