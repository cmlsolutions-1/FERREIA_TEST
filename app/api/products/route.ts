import { productService, publicProduct } from "@/server/modules/products/product.service"
import { createProductSchema, productFiltersSchema } from "@/server/modules/products/product.schema"
import { handleApi, success } from "@/server/shared/api-response"
import { parseBody, parseSearch } from "@/server/shared/validation"
import { requireAdmin } from "@/server/modules/auth/auth.service"

export const runtime = "nodejs"

export async function GET(request: Request) {
  return handleApi(async () => {
    const filters = parseSearch(request, productFiltersSchema)
    if (filters.admin) await requireAdmin(request)
    const result = await productService.list(filters)
    return success("Productos obtenidos correctamente", filters.admin ? result.data : result.data.map(publicProduct), 200, result.meta)
  })
}

export async function POST(request: Request) {
  return handleApi(async () => {
    await requireAdmin(request)
    const product = await productService.create(await parseBody(request, createProductSchema))
    return success("Producto creado correctamente", product, 201)
  })
}
