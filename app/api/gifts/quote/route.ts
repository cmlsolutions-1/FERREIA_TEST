import { giftService } from "@/server/modules/gifts/gift.service"
import { giftQuoteSchema } from "@/server/modules/gifts/gift.schema"
import { handleApi, success } from "@/server/shared/api-response"
import { parseSearch } from "@/server/shared/validation"

export const runtime = "nodejs"

export async function GET(request: Request) {
  return handleApi(async () => success("Progreso del obsequio obtenido correctamente", await giftService.quote(parseSearch(request, giftQuoteSchema).subtotal)))
}
