import type { Prisma } from "@prisma/client"
import { productRepository } from "@/server/modules/products/product.repository"
import { productToDto, publicProduct } from "@/server/modules/products/product.service"
import type { CatalogProduct } from "@/server/modules/ai/ai.schema"
import { resolveCatalogSpelling } from "@/server/modules/ai/ai.spelling"

const STOP_WORDS = new Set([
  "para", "con", "una", "uno", "unos", "unas", "del", "las", "los", "por", "que", "quiero",
  "necesito", "comprar", "construir", "fabricar", "hacer", "armar", "producto", "productos",
])

const normalize = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()

function singularToken(token: string) {
  if (token.length > 5 && token.endsWith("ces")) return `${token.slice(0, -3)}z`
  if (token.length > 6 && token.endsWith("es")) return token.slice(0, -2)
  if (token.length > 4 && token.endsWith("s")) return token.slice(0, -1)
  return token
}

function tokensFrom(terms: string[]) {
  return [...new Set(terms
    .flatMap((term) => normalize(term).split(/[^a-z0-9]+/))
    .map((token) => singularToken(token.trim()))
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token)))]
    .slice(0, 12)
}

function searchableFields(token: string): Prisma.ProductWhereInput[] {
  const contains = { contains: token, mode: "insensitive" as const }
  return [
    { sku: contains },
    { reference: contains },
    { supplierReference: contains },
    { barcodes: { some: { code: contains } } },
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
  const identifiers = normalize([
    product.sku,
    product.reference,
    product.supplierReference,
    ...product.barcodes.map(({ code }) => code),
  ].join(" "))
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
    if (identifiers.includes(token)) score += 30
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

function directProductMatch(product: ReturnType<typeof productToDto>, terms: string[]) {
  const normalizedName = normalize(product.name)
  const identifiers = [
    product.sku,
    product.reference,
    product.supplierReference,
    ...product.barcodes.map(({ code }) => code),
  ].map(normalize).filter((identifier) => identifier.length >= 4)
  const normalizedTerms = terms.map(normalize)
  if (identifiers.some((identifier) => normalizedTerms.some((term) => term.includes(identifier)))) return true
  const targetTokens = terms.flatMap((term) => tokensFrom([term]).slice(0, 1))
  return targetTokens.some((token) => normalizedName === token || normalizedName.startsWith(`${token} `))
}

function matchesRequirement(product: CatalogProduct, terms: string[]) {
  const searchable = normalize([
    product.name,
    product.description,
    product.category,
    product.categoryName,
    product.subcategory,
    product.brand,
  ].join(" "))
  return terms.some((term) => {
    const tokens = tokensFrom([term])
    return tokens.length > 0 && tokens.every((token) => searchable.includes(token))
  })
}

function catalogProduct(record: Awaited<ReturnType<typeof productRepository.list>>[number], matchType: "direct" | "related") {
  const dto = productToDto(record)
  const publicDto = publicProduct(dto)
  return {
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
    matchType,
  } satisfies CatalogProduct
}

export const aiCatalog = {
<<<<<<< HEAD
  async correctSpelling(message: string) {
    const products = await productRepository.spellingTerms()
    const vocabulary = products.flatMap((product) => [
      product.name,
      product.subcategory,
      product.line,
      product.group,
      product.subgroup,
      product.material ?? "",
      product.category.name,
      product.brand.name,
    ])
    return resolveCatalogSpelling(message, vocabulary)
  },
=======
  matchesRequirement,

<<<<<<< Updated upstream
>>>>>>> 15b3c85 (implementacion ia parte 2 correccion errores)
=======
  async correctSpelling(message: string) {
    const products = await productRepository.spellingTerms()
    const vocabulary = products.flatMap((product) => [
      product.name,
      product.subcategory,
      product.line,
      product.group,
      product.subgroup,
      product.material ?? "",
      product.category.name,
      product.brand.name,
    ])
    return resolveCatalogSpelling(message, vocabulary)
  },

>>>>>>> Stashed changes
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
        const product = catalogProduct(record, directProductMatch(dto, terms) ? "direct" : "related")
        return {
          score: relevanceScore(dto, tokens, terms),
<<<<<<< HEAD
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
            matchType: directProductMatch(dto, terms) ? "direct" as const : "related" as const,
          },
=======
          product,
>>>>>>> 15b3c85 (implementacion ia parte 2 correccion errores)
        }
      })
      .filter(({ score }) => score >= 6)
      .sort((left, right) => right.score - left.score || right.product.stock - left.product.stock)
      .slice(0, limit)
      .map(({ product }) => product)
  },

  async listActive(limit = 80): Promise<CatalogProduct[]> {
    const records = await productRepository.list({ active: true }, 0, limit, { stock: "desc" })
    return records.map((record) => catalogProduct(record, "related"))
  },
}
