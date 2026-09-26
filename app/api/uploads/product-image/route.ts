import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

import { LOCAL_IMAGE_DIRS } from "@/lib/upload-paths"
import { requireAdmin } from "@/server/modules/auth/auth.service"
import { ApiError } from "@/server/shared/api-error"
import { handleApi, success } from "@/server/shared/api-response"

export const runtime = "nodejs"

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/svg+xml", "svg"],
])

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

export async function POST(request: Request) {
  return handleApi(async () => {
  await requireAdmin(request)
  const formData = await request.formData()
  const file = formData.get("file")
  const productId = String(formData.get("productId") || "producto")
  const productName = String(formData.get("productName") || "imagen")

  if (!(file instanceof File)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Debes enviar una imagen.")
  }

  const extension = ALLOWED_TYPES.get(file.type)

  if (!extension) {
    throw new ApiError(400, "VALIDATION_ERROR", "Formato no permitido. Usa JPG, PNG, WEBP o SVG.")
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ApiError(400, "VALIDATION_ERROR", "La imagen no puede superar 5 MB.")
  }

  const safeProductId = slugify(productId) || "producto"
  const safeProductName = slugify(productName) || "imagen"
  const filename = `${safeProductId}-${safeProductName}-${Date.now()}.${extension}`
  const relativeUrl = `${LOCAL_IMAGE_DIRS.products}/${filename}`
  const uploadDir = path.join(
    process.cwd(),
    "public",
    LOCAL_IMAGE_DIRS.products.replace(/^\//, ""),
  )
  const filePath = path.join(uploadDir, filename)

  await mkdir(uploadDir, { recursive: true })
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()))

  return success("Imagen cargada correctamente", {
    url: relativeUrl,
    filename,
    storage: "local",
  }, 201)
  })
}
