import { z } from "zod"
import { giftService } from "@/server/modules/gifts/gift.service"
import { giftTierSchema } from "@/server/modules/gifts/gift.schema"
import { requireAdmin } from "@/server/modules/auth/auth.service"
import { handleApi, success } from "@/server/shared/api-response"
import { parseBody } from "@/server/shared/validation"

export const runtime = "nodejs"
type Context = { params: Promise<{ id: string }> }
const idSchema = z.object({ id: z.string().min(1) })

export async function PUT(request: Request, { params }: Context) {
  return handleApi(async () => {
    await requireAdmin(request)
    const { id } = idSchema.parse(await params)
    return success("Regla de obsequio actualizada correctamente", await giftService.save(await parseBody(request, giftTierSchema), id))
  })
}

export async function DELETE(request: Request, { params }: Context) {
  return handleApi(async () => {
    await requireAdmin(request)
    const { id } = idSchema.parse(await params)
    await giftService.remove(id)
    return success("Regla de obsequio eliminada correctamente", { deleted: true })
  })
}
