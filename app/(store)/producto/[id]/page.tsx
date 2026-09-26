import { notFound } from "next/navigation"
import { ProductDetail } from "@/components/store/product-detail"
import type { Product } from "@/lib/data"
import { serverApiRequest } from "@/services/server-api"

export const dynamic = "force-dynamic"

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let product: Product
  try { product = (await serverApiRequest<Product>(`/api/products/${encodeURIComponent(id)}`)).data }
  catch { notFound() }
  return <ProductDetail product={product} />
}
