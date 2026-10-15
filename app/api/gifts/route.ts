import { giftService } from "@/server/modules/gifts/gift.service"
import { giftTierSchema } from "@/server/modules/gifts/gift.schema"
import { requireAdmin } from "@/server/modules/auth/auth.service"
import { handleApi, success } from "@/server/shared/api-response"
import { parseBody } from "@/server/shared/validation"

export const runtime = "nodejs"

export async function GET(request: Request) {
  return handleApi(async () => {
    const admin = new URL(request.url).searchParams.get("admin") === "true"
    if (admin) await requireAdmin(request)
    return success("Reglas de obsequios obtenidas correctamente", await giftService.list(admin))
  })
}

export async function POST(request: Request) {
  return handleApi(async () => {
    await requireAdmin(request)
    return success("Regla de obsequio creada correctamente", await giftService.save(await parseBody(request, giftTierSchema)), 201)
  })
}
