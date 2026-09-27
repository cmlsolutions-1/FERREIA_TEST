import { NextResponse } from "next/server"
import { requireAdmin } from "@/server/modules/auth/auth.service"
import { reportExportSchema } from "@/server/modules/reports/report.schema"
import { reportService } from "@/server/modules/reports/report.service"
import { handleApi } from "@/server/shared/api-response"

export const runtime = "nodejs"
type Context = { params: Promise<{ kind: string }> }
export async function GET(request: Request, context: Context) {
  return handleApi(async () => {
    await requireAdmin(request)
    const { kind } = reportExportSchema.parse(await context.params)
    return new NextResponse(await reportService.export(kind), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="ferreia-${kind}.csv"` } })
  })
}
