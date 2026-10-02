import type { AdvisorImage } from "@/server/modules/ai/ai.schema"

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_IMAGE_SIDE = 768
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

export async function prepareAdvisorImage(file: File): Promise<AdvisorImage> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("La foto debe estar en formato JPG, PNG o WEBP.")
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("La foto no puede superar los 10 MB.")
  }

  const bitmap = await createImageBitmap(file)
  try {
    if (bitmap.width < 32 || bitmap.height < 32) {
      throw new Error("La foto es demasiado pequeña para poder analizarla.")
    }
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d")
    if (!context) throw new Error("El navegador no pudo preparar la foto.")
    context.fillStyle = "#ffffff"
    context.fillRect(0, 0, width, height)
    context.drawImage(bitmap, 0, 0, width, height)
    return { name: file.name, dataUrl: canvas.toDataURL("image/jpeg", 0.82) }
  } finally {
    bitmap.close()
  }
}
