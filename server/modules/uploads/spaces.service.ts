import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { ApiError } from "@/server/shared/api-error"

const extensions = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const
export type ProductImageType = keyof typeof extensions

function configuration() {
  const { SPACES_BUCKET, SPACES_KEY, SPACES_SECRET, SPACES_ENDPOINT, SPACES_URL_CDN } = process.env
  if (!SPACES_BUCKET || !SPACES_KEY || !SPACES_SECRET || !SPACES_ENDPOINT || !SPACES_URL_CDN) {
    throw new ApiError(503, "SPACES_NOT_CONFIGURED", "El almacenamiento de imágenes no está configurado")
  }
  let endpoint: URL
  let cdn: URL
  try { endpoint = new URL(SPACES_ENDPOINT); cdn = new URL(SPACES_URL_CDN) }
  catch { throw new ApiError(503, "SPACES_NOT_CONFIGURED", "La configuración de imágenes no es válida") }
  if (endpoint.protocol !== "https:" || cdn.protocol !== "https:" || endpoint.username || endpoint.password || cdn.username || cdn.password) {
    throw new ApiError(503, "SPACES_NOT_CONFIGURED", "La configuración de imágenes no es válida")
  }
  return { bucket: SPACES_BUCKET, key: SPACES_KEY, secret: SPACES_SECRET, endpoint: endpoint.origin, cdn: cdn.href.replace(/\/+$/, "") }
}

let client: S3Client | undefined
function spacesClient(config: ReturnType<typeof configuration>) {
  client ??= new S3Client({ endpoint: config.endpoint, region: "us-east-1", forcePathStyle: false, credentials: { accessKeyId: config.key, secretAccessKey: config.secret } })
  return client
}

export async function uploadProductImage(bytes: Buffer, contentType: ProductImageType) {
  const config = configuration()
  const filename = `${crypto.randomUUID()}.${extensions[contentType]}`
  const objectKey = `products/${filename}`
  try {
    await spacesClient(config).send(new PutObjectCommand({
      Bucket: config.bucket,
      Key: objectKey,
      Body: bytes,
      ContentType: contentType,
      ContentDisposition: "inline",
      CacheControl: "public, max-age=31536000, immutable",
      ACL: "public-read",
    }))
  } catch (error) {
    console.error("Spaces product image upload failed", { name: error instanceof Error ? error.name : "unknown" })
    throw new ApiError(502, "IMAGE_UPLOAD_FAILED", "No fue posible subir la imagen. Intenta de nuevo")
  }
  return { url: `${config.cdn}/${objectKey}`, filename, storage: "spaces" as const }
}
