import { requireAdmin } from "@/server/modules/auth/auth.service"
import { uploadProductImage, type ProductImageType } from "@/server/modules/uploads/spaces.service"
import { ApiError } from "@/server/shared/api-error"
import { handleApi, success } from "@/server/shared/api-response"

export const runtime = "nodejs"

const MAX_FILE_SIZE = 5 * 1024 * 1024
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const

function matchesSignature(bytes: Buffer, type: ProductImageType) {
  if (type === "image/jpeg") return bytes.length > 3 && bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
  if (type === "image/png") return bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  return bytes.length > 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP"
}

export async function POST(request: Request) {
  return handleApi(async () => {
    await requireAdmin(request)
    let formData: FormData
    try { formData = await request.formData() }
    catch { throw new ApiError(400, "INVALID_REQUEST", "Envía la imagen como formulario válido") }
    const file = formData.get("file")
    if (!(file instanceof File)) throw new ApiError(400, "VALIDATION_ERROR", "Debes seleccionar una imagen")
    if (!IMAGE_TYPES.some((type) => type === file.type)) throw new ApiError(400, "VALIDATION_ERROR", "Usa imágenes JPG, PNG o WEBP")
    if (!file.size || file.size > MAX_FILE_SIZE) throw new ApiError(400, "VALIDATION_ERROR", "La imagen debe tener contenido y no superar 5 MB")
    const bytes = Buffer.from(await file.arrayBuffer())
    const contentType = file.type as ProductImageType
    if (!matchesSignature(bytes, contentType)) throw new ApiError(400, "VALIDATION_ERROR", "El archivo no coincide con el formato de imagen indicado")
    return success("Imagen cargada correctamente", await uploadProductImage(bytes, contentType), 201)
  })
}
