import { productService, publicProduct } from "@/server/modules/products/product.service"
import { updateProductSchema } from "@/server/modules/products/product.schema"
import { handleApi, success } from "@/server/shared/api-response"
import { idSchema, parseBody } from "@/server/shared/validation"
import { requireAdmin } from "@/server/modules/auth/auth.service"

export const runtime = "nodejs"
type Context = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: Context) {
  return handleApi(async () => { const admin = new URL(request.url).searchParams.get("admin") === "true"; if (admin) await requireAdmin(request); const product = await productService.get(idSchema.parse(await context.params).id); return success("Producto obtenido correctamente", admin ? product : publicProduct(product)) })
}

export async function PATCH(request: Request, context: Context) {
  return handleApi(async () => {
    await requireAdmin(request)
    const id = idSchema.parse(await context.params).id
    return success("Producto actualizado correctamente", await productService.update(id, await parseBody(request, updateProductSchema)))
  })
}

export async function DELETE(request: Request, context: Context) {
  return handleApi(async () => {
    await requireAdmin(request)
    await productService.remove(idSchema.parse(await context.params).id)
    return success("Producto desactivado correctamente", { deleted: true })
  })
}
