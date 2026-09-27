import { requireAdmin } from "@/server/modules/auth/auth.service"
import { reportService } from "@/server/modules/reports/report.service"
import { handleApi, success } from "@/server/shared/api-response"

export const runtime = "nodejs"
export async function GET(request: Request) { return handleApi(async () => { await requireAdmin(request); return success("Reporte consolidado obtenido correctamente", await reportService.summary()) }) }
