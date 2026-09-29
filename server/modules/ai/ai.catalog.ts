import type { Prisma } from "@prisma/client"
import { productRepository } from "@/server/modules/products/product.repository"
import { productToDto, publicProduct } from "@/server/modules/products/product.service"
import type { CatalogProduct } from "@/server/modules/ai/ai.schema"

const STOP_WORDS = new Set([
  "para", "con", "una", "uno", "unos", "unas", "del", "las", "los", "por", "que", "quiero",
  "necesito", "comprar", "construir", "fabricar", "hacer", "armar", "producto", "productos",
])

const normalize = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()

function tokensFrom(terms: string[]) {
  return [...new Set(terms
    .flatMap((term) => normalize(term).split(/[^a-z0-9]+/))
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token)))]
    .slice(0, 12)
}

function searchableFields(token: string): Prisma.ProductWhereInput[] {
  const contains = { contains: token, mode: "insensitive" as const }
  return [
    { name: contains },
    { description: contains },
    { characteristics: contains },
    { subcategory: contains },
    { line: contains },
    { group: contains },
    { subgroup: contains },
    { material: contains },
    { category: { name: contains } },
    { category: { slug: contains } },
    { brand: { name: contains } },
    { specs: { some: { OR: [{ label: contains }, { value: contains }] } } },
    { compatibilities: { some: { value: contains } } },
  ]
}

function relevanceScore(product: ReturnType<typeof productToDto>, tokens: string[], phrases: string[]) {
  const name = normalize(product.name)
  const subcategory = normalize(product.subcategory)
  const category = normalize(`${product.category} ${product.categoryName}`)
  const brand = normalize(product.brand)
  const description = normalize(`${product.description} ${product.characteristics} ${product.material ?? ""}`)
  const specifications = normalize([
    ...product.specs.map(({ label, value }) => `${label} ${value}`),
    ...product.compatibilities,
  ].join(" "))

  let score = 0
  for (const token of tokens) {
    if (name.includes(token)) score += 12
    if (subcategory.includes(token)) score += 8
    if (category.includes(token)) score += 6
    if (brand.includes(token)) score += 5
    if (description.includes(token)) score += 3
    if (specifications.includes(token)) score += 2
  }
  for (const phrase of phrases.map(normalize)) {
    if (phrase.length > 2 && name.includes(phrase)) score += 20
  }
  return score
}

function directProductMatch(name: string, terms: string[]) {
  const normalizedName = normalize(name)
  const targetTokens = terms.flatMap((term) => tokensFrom([term]).slice(0, 1))
  return targetTokens.some((token) => normalizedName === token || normalizedName.startsWith(`${token} `))
}

export const aiCatalog = {
  async search(terms: string[], limit = 6): Promise<CatalogProduct[]> {
    const tokens = tokensFrom(terms)
    if (tokens.length === 0) return []

    const where: Prisma.ProductWhereInput = {
      active: true,
      OR: tokens.flatMap(searchableFields),
    }
    const records = await productRepository.list(where, 0, 60, { stock: "desc" })

    return records
      .map((record) => {
        const dto = productToDto(record)
        const publicDto = publicProduct(dto)
        return {
          score: relevanceScore(dto, tokens, terms),
          product: {
            id: publicDto.id,
            sku: publicDto.sku,
            name: publicDto.name,
            description: publicDto.description,
            category: publicDto.category,
            categoryName: publicDto.categoryName,
            subcategory: publicDto.subcategory,
            productType: publicDto.productType,
            brand: publicDto.brand,
            price: publicDto.price,
            stock: publicDto.stock,
            image: publicDto.image,
            matchType: directProductMatch(publicDto.name, terms) ? "direct" as const : "related" as const,
          },
        }
      })
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score || right.product.stock - left.product.stock)
      .slice(0, limit)
      .map(({ product }) => product)
  },
}
