import { z } from "zod"
import { aiCatalog } from "@/server/modules/ai/ai.catalog"
import { aiConfig } from "@/server/modules/ai/ai.config"
import { evaluateAiBusinessPolicy } from "@/server/modules/ai/ai.policy"
import { aiPlanner } from "@/server/modules/ai/ai.plan"
import { aiProvider } from "@/server/modules/ai/ai.provider"
import { aiVision } from "@/server/modules/ai/ai.vision"
import type { SpellingResolution } from "@/server/modules/ai/ai.spelling"
import {
  imageAnalysisSchema,
  projectAnalysisSchema,
  projectAdvisorResponseSchema,
  type AdvisorRequest,
  type ProjectAnalysis,
  type ProjectAdvisorResponse,
  type ProjectPlan,
  type ProjectPlanDraft,
  type VisionResult,
} from "@/server/modules/ai/ai.schema"

const SYSTEM_PROMPT = `Eres el analizador de solicitudes de FerreBot, el asistente de la ferretería FERREIA.
Tu trabajo en esta etapa es clasificar y extraer información, no recomendar productos concretos.

Reglas obligatorias:
- Los proyectos manuales válidos incluyen muebles, mesas, armarios, alacenas, repisas, soportes, instalación y trabajos de ferretería.
- Fabricar aparatos electrónicos como televisores, computadores, celulares o consolas está fuera de alcance.
- "Mueble para televisor" y "soporte para televisor" sí son proyectos manuales válidos.
- Si la persona quiere construir algo, primero se deberá buscar si existe terminado en el catálogo y luego buscar los materiales y consumibles que quedarán incorporados al proyecto.
- Las herramientas manuales o eléctricas necesarias para trabajar se sugieren aparte, sin precio y sin sumarlas a la cotización del proyecto.
- No inventes productos, precios, existencias, marcas ni cantidades.
- Para un proyecto manual identifica las especificaciones conocidas y pregunta únicamente las indispensables que falten, por ejemplo dimensiones, material, uso o configuración.
- El acabado no es obligatorio: si no solicitan pintura, barniz, laca o color, considera una versión básica armada y funcional sin acabado, y no preguntes por él antes de calcular.
- Nunca solicites presupuesto, rango de precios ni cuánto quiere gastar la persona.
- Los términos de búsqueda deben ser palabras cortas útiles para consultar un catálogo de ferretería.
- Responde únicamente con el JSON solicitado.`

const placeholder = /^(n\/?a|no aplica|ninguno|ninguna|sin nombre|no especificad[oa]|sin especificar|desconocid[oa]|por definir|null|undefined|-+)$/i
const budgetQuestion = /\b(presupuesto|rango de precios?|cu[aá]nto (?:quiere|puede) gastar|dinero disponible)\b/i
const manualAction = /\b(construir|fabricar|hacer|armar|ensamblar|crear)\b/i
const normalizeLabel = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
const noFinish = /\bsin\s+(?:pintura|barniz|acabado)|\bcrudo\b|\bsin terminar\b/i
const finishRequirement = /\b(pintura|barniz|laca|sellador|acabado)\b/i

function specificationGroup(value: string) {
  const normalized = normalizeLabel(value)
  if (/material|madera|mdf|melamina|metal|acero|aluminio/.test(normalized)) return "material"
  if (/dimension|medida|tamano|ancho|alto|largo|profundidad|grosor|espesor/.test(normalized)) return "dimensions"
  if (/acabado|color|barniz|pintura|mate|brillante/.test(normalized)) return "finish"
  if (/uso|destino|ubicacion|interior|exterior/.test(normalized)) return "use"
  if (/configuracion|pata|puerta|cajon|repisa|division/.test(normalized)) return "configuration"
  return normalized
}

const formatCop = (value: number) => new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
}).format(value)

const unique = (values: string[]) => [...new Set(values
  .map((value) => value.trim())
  .filter((value) => value.length > 0 && !placeholder.test(value)))]

function withSpellingNotice(response: ProjectAdvisorResponse, spelling: SpellingResolution) {
  if (spelling.corrections.length === 0) return response
  const interpretations = spelling.corrections.map(({ original, corrected }) => `“${original}” como “${corrected}”`)
  const notice = spelling.corrections.length === 1
    ? `¿Quizás quisiste decir “${spelling.corrections[0].corrected}” en lugar de “${spelling.corrections[0].original}”? Interpreté tu solicitud de esa manera.`
    : `Interpreté ${interpretations.join(" y ")} para buscar en el catálogo.`
  return projectAdvisorResponseSchema.parse({ ...response, assistantMessage: `${notice} ${response.assistantMessage}` })
}

function enrichKnownSpecifications(
  specifications: z.infer<typeof projectAnalysisSchema>["knownSpecifications"],
  currentMessage: string,
  projectName: string,
) {
  const current = [...specifications]
  const hasMaterial = current.some(({ name }) => normalizeLabel(name) === "material")
  if (!hasMaterial) {
    const material = ["madera", "mdf", "melamina", "metal", "acero", "aluminio", "plywood", "triplex"]
      .find((value) => new RegExp(`\\b${value}\\b`, "i").test(currentMessage))
    if (material) current.push({ name: "material", value: material })
  }
  const hasDimensions = current.some(({ name }) => specificationGroup(name) === "dimensions")
  const dimensions = currentMessage.match(/\d+(?:[.,]\d+)?\s*(?:mm|cm|m)\b/gi)
  if (!hasDimensions && dimensions?.length) current.push({ name: "dimensiones", value: dimensions.join(" × ") })
  const hasFinish = current.some(({ name }) => specificationGroup(name) === "finish")
  const finish = currentMessage.match(/\b(?:sin\s+(?:pintura|barniz|acabado)|barniz(?:ado)?|pintura|natural|mate|brillante|pintad[oa]|lacad[oa])\b/gi)
  if (!hasFinish && finish?.length) current.push({ name: "acabado", value: [...new Set(finish.map((value) => value.toLowerCase()))].join(", ") })
  const hasConfiguration = current.some(({ name }) => specificationGroup(name) === "configuration")
  const configuration = currentMessage.match(/\b(?:con\s+)?(?:una|un|dos|tres|cuatro|cinco|seis|\d+)\s+(?:patas?|puertas?|cajones?|repisas?|divisiones?)\b/i)
  if (!hasConfiguration && configuration) current.push({ name: "configuración", value: configuration[0] })
  const hasUse = current.some(({ name }) => ["uso", "destino"].includes(normalizeLabel(name)))
  const projectUse = projectName.match(/\bpara\s+(.+)$/i)?.[1]?.trim()
  if (!hasUse && projectUse) current.push({ name: "uso", value: `para ${projectUse}` })
  return current
}

function resolveProjectName(projectName: string, searchTerms: string[], normalizedRequest: string) {
  if (!placeholder.test(projectName.trim())) return projectName.trim()
  if (searchTerms.length > 0) return searchTerms.join(" ")
  return normalizedRequest.trim()
}

function describeCatalog(products: ProjectAdvisorResponse["catalog"]["products"]) {
  return products.slice(0, 3).map((product) => (
    `${product.name} por ${formatCop(product.price)} (${product.stock} disponibles)`
  )).join("; ")
}

function buildCatalogMessage(
  intent: z.infer<typeof projectAnalysisSchema>["intent"],
  projectName: string,
  products: ProjectAdvisorResponse["catalog"]["products"],
  fromVision = false,
) {
  const direct = products.filter((product) => (
    product.matchType === "direct" && (intent !== "manual_project" || product.productType === "FINISHED_PRODUCT")
  ))
  const directIds = new Set(direct.map((product) => product.id))
  const related = products.filter((product) => !directIds.has(product.id))

  if (intent === "manual_project") {
    if (direct.length > 0) {
      return fromVision
        ? `Antes de construirlo, encontré estas posibles opciones terminadas en el catálogo: ${describeCatalog(direct)}.`
        : `Antes de construirlo, encontré estas opciones terminadas en el catálogo: ${describeCatalog(direct)}.`
    }
    const relatedMessage = related.length > 0
      ? ` Sí encontré posibles productos relacionados que podrían servir después de definir el proyecto: ${describeCatalog(related)}.`
      : ""
    return `Primero revisé el catálogo y no encontré ${projectName} como producto terminado.${relatedMessage}`
  }

  if (direct.length > 0) {
    return fromVision
      ? `Encontré estas posibles coincidencias en el catálogo: ${describeCatalog(direct)}.`
      : `Encontré en el catálogo: ${describeCatalog(direct)}.`
  }
  if (related.length > 0) return `No encontré una coincidencia exacta para ${projectName}, pero sí estas opciones relacionadas: ${describeCatalog(related)}.`
  return `Revisé el catálogo y no encontré coincidencias para ${projectName}.`
}

async function blockedByPolicy(message: string, subject: string, searchTerms: string[]): Promise<ProjectAdvisorResponse> {
  const products = await aiCatalog.search(searchTerms)
  const catalogMessage = products.length > 0
    ? ` En el catálogo encontré estas opciones relacionadas: ${describeCatalog(products)}.`
    : " Revisé el catálogo actual y no encontré ese producto ni opciones directamente relacionadas."
  return projectAdvisorResponseSchema.parse({
    status: "blocked",
    intent: "out_of_scope",
    assistantMessage: `${message}${catalogMessage}`,
    projectName: subject,
    searchTerms,
    knownSpecifications: [],
    missingSpecifications: [],
    shouldSearchCatalog: true,
    source: "business_policy",
    model: null,
    catalog: { searched: true, queryTerms: searchTerms, products },
  })
}

function responseFromAnalysis(
  analysis: z.infer<typeof projectAnalysisSchema>,
  model: string,
  products: ProjectAdvisorResponse["catalog"]["products"],
  currentMessage: string,
  vision?: VisionResult,
): ProjectAdvisorResponse {
  const searchTerms = unique(analysis.searchTerms)
  const projectName = resolveProjectName(analysis.projectName, searchTerms, analysis.normalizedRequest)
  const knownSpecifications = enrichKnownSpecifications(analysis.knownSpecifications, currentMessage, projectName).filter(({ name, value }) => (
    !placeholder.test(name.trim()) && !placeholder.test(value.trim())
  ))
  const knownGroups = new Set(knownSpecifications.map(({ name }) => specificationGroup(name)))
  const missing = analysis.intent === "manual_project"
    ? unique(analysis.missingSpecifications).filter((value) => (
      !budgetQuestion.test(value)
      && specificationGroup(value) !== "finish"
      && !knownGroups.has(specificationGroup(value))
    ))
    : []

  if (analysis.intent === "out_of_scope") {
    return projectAdvisorResponseSchema.parse({
      status: "blocked",
      intent: analysis.intent,
      assistantMessage: `${analysis.summary} Puedo ayudarte con proyectos manuales o con productos disponibles en el catálogo de FERREIA.`,
      projectName,
      searchTerms,
      knownSpecifications,
      missingSpecifications: [],
      shouldSearchCatalog: false,
      source: "ollama",
      model,
      catalog: { searched: false, queryTerms: searchTerms, products: [] },
    })
  }

  const needsInformation = analysis.intent === "manual_project" && missing.length > 0
  const catalogMessage = buildCatalogMessage(analysis.intent, projectName, products, Boolean(vision))
  const catalogResponse = needsInformation
    ? `${catalogMessage} Si deseas construirlo, necesito: ${missing.join(", ")}.`
    : catalogMessage
  const assistantMessage = vision
    ? `La imagen parece mostrar ${vision.detectedObject}. ${catalogResponse}`
    : catalogResponse

  return projectAdvisorResponseSchema.parse({
    status: needsInformation ? "needs_information" : "ready_for_catalog",
    intent: analysis.intent,
    assistantMessage,
    projectName,
    searchTerms,
    knownSpecifications,
    missingSpecifications: missing,
    shouldSearchCatalog: analysis.shouldSearchCatalog,
    source: "ollama",
    model,
    catalog: { searched: analysis.shouldSearchCatalog, queryTerms: searchTerms, products },
    ...(vision ? { vision } : {}),
  })
}

function visionMetadata(analysis: z.infer<typeof imageAnalysisSchema>): VisionResult {
  return {
    imageType: analysis.imageType,
    imagePresentation: analysis.imagePresentation,
    detectedObject: analysis.detectedObject,
    confidence: analysis.confidence,
    visibleText: analysis.visibleText,
    materialsObserved: analysis.materialsObserved,
  }
}

function projectAnalysisFromImage(
  analysis: z.infer<typeof imageAnalysisSchema>,
  currentMessage: string,
): z.infer<typeof projectAnalysisSchema> {
  const knownSpecifications = analysis.materialsObserved.length > 0
    ? [{ name: "material visible estimado", value: analysis.materialsObserved.join(", ") }]
    : []

  const visualSearchTerms = unique([
    analysis.detectedObject,
    ...analysis.visibleText,
    ...analysis.searchTerms,
  ]).slice(0, 8)

  return projectAnalysisSchema.parse({
    intent: analysis.intent,
    normalizedRequest: currentMessage,
    projectName: analysis.detectedObject,
    searchTerms: visualSearchTerms,
    knownSpecifications,
    missingSpecifications: analysis.missingSpecifications,
    shouldSearchCatalog: analysis.shouldSearchCatalog,
    summary: analysis.summary,
  })
}

function unclearImageResponse(
  analysis: z.infer<typeof imageAnalysisSchema>,
  model: string,
): ProjectAdvisorResponse {
  const vision = visionMetadata(analysis)
  const unsupportedPresentation = !["photo", "product_render", "technical_drawing"].includes(analysis.imagePresentation)
  const guidance = unsupportedPresentation
    ? "Para consultar el inventario necesito una foto o representación donde se vea claramente el mueble, la herramienta o el material."
    : "Prueba con una foto más clara, bien iluminada y donde el objeto ocupe la mayor parte de la imagen."
  return projectAdvisorResponseSchema.parse({
    status: "needs_information",
    intent: "product_advice",
    assistantMessage: `${analysis.summary} No puedo relacionarla responsablemente con el inventario todavía. ${guidance}`,
    projectName: analysis.detectedObject,
    searchTerms: [],
    knownSpecifications: [],
    missingSpecifications: [],
    shouldSearchCatalog: false,
    source: "ollama",
    model,
    catalog: { searched: false, queryTerms: [], products: [] },
    vision,
  })
}

async function buildProjectPlan(
  draft: ProjectPlanDraft,
  options: Pick<ProjectPlan, "isBasic" | "optionalAddOns">,
): Promise<ProjectPlan> {
  const selectedIds = new Set<string>()
  const unavailable: ProjectPlan["unavailable"] = []
  const items: ProjectPlan["items"] = []
  const recommendedTools: ProjectPlan["recommendedTools"] = draft.requirements
    .filter((requirement) => requirement.productType === "TOOL")
    .filter((requirement, index, collection) => (
      collection.findIndex((candidate) => normalizeLabel(candidate.name) === normalizeLabel(requirement.name)) === index
    ))
    .map((requirement) => ({
      name: requirement.name,
      purpose: requirement.purpose,
      note: requirement.quantityDescription,
    }))

  const pricedRequirements = draft.requirements.filter((requirement) => requirement.productType !== "TOOL")
  const matches = await Promise.all(pricedRequirements.map(async (requirement) => {
    const products = await aiCatalog.search(requirement.searchTerms, 5)
    const product = products.find((candidate) => (
      aiCatalog.matchesRequirement(candidate, requirement.searchTerms)
      &&
      (
        candidate.productType === requirement.productType
        || (["MATERIAL", "CONSUMABLE"].includes(candidate.productType) && ["MATERIAL", "CONSUMABLE"].includes(requirement.productType))
      )
      && candidate.stock >= requirement.purchaseQuantity
    ))
    return { requirement, product }
  }))

  for (const { requirement, product } of matches) {
    if (!product) {
      unavailable.push({
        name: requirement.name,
        quantityDescription: requirement.quantityDescription,
        purpose: requirement.purpose,
      })
      continue
    }
    if (selectedIds.has(product.id)) {
      unavailable.push({
        name: requirement.name,
        quantityDescription: requirement.quantityDescription,
        purpose: requirement.purpose,
      })
      continue
    }
    selectedIds.add(product.id)
    items.push({
      product,
      quantity: requirement.purchaseQuantity,
      requirement: requirement.name,
      purpose: requirement.purpose,
      note: requirement.quantityDescription,
      unitPrice: product.price,
      subtotal: product.price * requirement.purchaseQuantity,
    })
  }

  for (const requirement of draft.requirements) {
    if (requirement.productType === "TOOL") continue
    const represented = items.some((item) => normalizeLabel(item.requirement) === normalizeLabel(requirement.name))
      || unavailable.some((item) => normalizeLabel(item.name) === normalizeLabel(requirement.name))
    if (!represented) {
      unavailable.push({
        name: requirement.name,
        quantityDescription: requirement.quantityDescription,
        purpose: requirement.purpose,
      })
    }
  }

  const uniqueUnavailable = unavailable.filter((item, index, collection) => (
    collection.findIndex((candidate) => normalizeLabel(candidate.name) === normalizeLabel(item.name)) === index
  ))
  const suppliesTotal = items.reduce((sum, item) => sum + item.subtotal, 0)

  return {
    title: draft.title,
    summary: draft.summary,
    isEstimate: true,
    isBasic: options.isBasic,
    currency: "COP",
    total: suppliesTotal,
    suppliesTotal,
    items,
    recommendedTools,
    unavailable: uniqueUnavailable,
    optionalAddOns: options.optionalAddOns,
    steps: draft.steps,
    assumptions: draft.assumptions,
    safetyNotes: draft.safetyNotes,
  }
}

function ensureCoreSpecificationCoverage(
  plan: ProjectPlan,
  specifications: Array<{ name: string; value: string }>,
): ProjectPlan {
  const missing = [...plan.unavailable]
  const requiredGroups = [
    {
      group: "material",
      quantityDescription: "Cantidad según el despiece y las medidas suministradas",
      purpose: "Construir la estructura principal del proyecto",
    },
    {
      group: "finish",
      quantityDescription: "Cantidad según el área y rendimiento del producto",
      purpose: "Aplicar el acabado solicitado",
    },
  ]

  for (const required of requiredGroups) {
    const specification = specifications.find(({ name }) => specificationGroup(name) === required.group)
    if (!specification) continue
    if (required.group === "finish" && noFinish.test(normalizeLabel(specification.value))) continue
    const represented = plan.items.some((item) => specificationGroup(item.requirement) === required.group)
      || missing.some((item) => (
        specificationGroup(item.name) === required.group
        || normalizeLabel(item.name).includes(normalizeLabel(specification.value))
      ))
    if (!represented) {
      missing.push({
        name: specification.value,
        quantityDescription: required.quantityDescription,
        purpose: required.purpose,
      })
    }
  }

  return { ...plan, unavailable: missing }
}

async function attachProjectPlan(
  response: ProjectAdvisorResponse,
  analysis: ProjectAnalysis,
): Promise<ProjectAdvisorResponse> {
  if (response.intent !== "manual_project" || response.status !== "ready_for_catalog") return response

  const { data } = await aiPlanner.create(analysis, response.knownSpecifications)
  const finishSpecification = response.knownSpecifications.find(({ name }) => specificationGroup(name) === "finish")
  const requestedFinish = Boolean(finishSpecification && !noFinish.test(normalizeLabel(finishSpecification.value)))
  const projectText = normalizeLabel(`${analysis.projectName} ${analysis.normalizedRequest}`)
  const isFurniture = /mesa|armario|alacena|mueble|repis|gabinete|biblioteca|escritorio/.test(projectText)
  const controlledDraft = requestedFinish
    ? data
    : {
        ...data,
        requirements: data.requirements.filter((requirement) => !finishRequirement.test(normalizeLabel([
          requirement.name,
          requirement.purpose,
          ...requirement.searchTerms,
        ].join(" ")))),
      }
  const optionalAddOns: ProjectPlan["optionalAddOns"] = isFurniture && !finishSpecification
    ? [{
        name: "Pintura, barniz o acabado",
        description: "No está incluido en el total básico. Se puede agregar después según el color y la protección que prefieras.",
        followUpPrompt: "¿Quieres agregar pintura, barniz u otro acabado?",
      }]
    : []
  const plan = ensureCoreSpecificationCoverage(await buildProjectPlan(controlledDraft, {
    isBasic: !requestedFinish,
    optionalAddOns,
  }), response.knownSpecifications)
  const selectedProducts = plan.items.map((item) => item.product)
  const productIds = new Set<string>()
  const products = [...response.catalog.products, ...selectedProducts].filter((product) => {
    if (productIds.has(product.id)) return false
    productIds.add(product.id)
    return true
  })
  const availableMessage = plan.items.length > 0
    ? ` Preparé una estimación con ${plan.items.length} ${plan.items.length === 1 ? "material o insumo disponible" : "materiales e insumos disponibles"} por ${formatCop(plan.total)}.`
    : " No encontré en el inventario actual los insumos suficientes para cotizar este proyecto."
  const toolsMessage = plan.recommendedTools.length > 0
    ? ` También te indico ${plan.recommendedTools.length} ${plan.recommendedTools.length === 1 ? "herramienta necesaria" : "herramientas necesarias"}; son recomendaciones de trabajo y no están incluidas en el precio.`
    : ""
  const unavailableMessage = plan.unavailable.length > 0
    ? ` También necesitarías conseguir por fuera: ${plan.unavailable.slice(0, 5).map((item) => item.name).join(", ")}.`
    : ""
  const optionalMessage = plan.optionalAddOns.length > 0
    ? " Esta es la versión básica, sin pintura ni barniz. ¿Quieres agregar pintura, barniz u otro acabado como opción adicional?"
    : ""

  return projectAdvisorResponseSchema.parse({
    ...response,
    assistantMessage: `${response.assistantMessage}${availableMessage}${toolsMessage}${unavailableMessage}${optionalMessage}`,
    catalog: { ...response.catalog, searched: true, products },
    plan,
  })
}

export const aiAgent = {
  async advise(input: AdvisorRequest): Promise<ProjectAdvisorResponse> {
    const currentMessage = input.message || "Analiza esta imagen y busca productos relacionados."
    const spelling = await aiCatalog.correctSpelling(currentMessage)
    const interpretedMessage = spelling.message
    const policy = evaluateAiBusinessPolicy(interpretedMessage)
    if (!policy.allowed) return withSpellingNotice(await blockedByPolicy(policy.message, policy.subject, policy.searchTerms), spelling)

    if (input.image) {
      const { data, model } = await aiVision.analyze(interpretedMessage, input.image.dataUrl)
      const supportedPresentation = ["photo", "product_render", "technical_drawing"].includes(data.imagePresentation)
      if (!supportedPresentation || !data.containsRelevantObject || data.imageType === "other" || data.imageType === "uncertain" || data.confidence < 0.35) {
        return withSpellingNotice(unclearImageResponse(data, model || aiConfig.model), spelling)
      }

      const imageProjectAnalysis = projectAnalysisFromImage(data, interpretedMessage)
      const catalogTerms = unique(imageProjectAnalysis.searchTerms)
      const enrichedData = { ...imageProjectAnalysis, searchTerms: catalogTerms }
      const products = imageProjectAnalysis.shouldSearchCatalog
        ? await aiCatalog.search(catalogTerms)
        : []
      const response = responseFromAnalysis(
        enrichedData,
        model || aiConfig.model,
        products,
        interpretedMessage,
        visionMetadata(data),
      )
      return withSpellingNotice(await attachProjectPlan(response, enrichedData), spelling)
    }

    const schema = z.toJSONSchema(projectAnalysisSchema)
    const { data, model } = await aiProvider.structuredChat([
      { role: "system", content: SYSTEM_PROMPT },
      ...input.history.map(({ role, content }) => ({ role, content })),
      {
        role: "user",
        content: `Usa el contexto anterior cuando corresponda y analiza la solicitud actual. Esquema requerido: ${JSON.stringify(schema)}\nSolicitud original: ${input.message}\nSolicitud interpretada con vocabulario del catálogo: ${interpretedMessage}`,
      },
    ], projectAnalysisSchema)

    const correctedTerms = spelling.corrections.map(({ corrected }) => corrected)
    const modelTerms = data.intent === "manual_project" && !placeholder.test(data.projectName)
      ? unique([data.projectName, ...data.searchTerms])
      : unique(data.searchTerms)
    const catalogTerms = unique([...correctedTerms, ...modelTerms])
    const shouldSearchCatalog = data.shouldSearchCatalog || catalogTerms.length > 0
    const products = shouldSearchCatalog ? await aiCatalog.search(catalogTerms) : []
    const directProduct = products.find((product) => product.matchType === "direct")
    const directProductRequest = Boolean(directProduct) && !manualAction.test(interpretedMessage)
    const responseProducts = directProductRequest
      ? products.filter((product) => product.matchType === "direct" || product.category === directProduct!.category)
      : products
    const enrichedData = directProductRequest
      ? { ...data, intent: "finished_product_search" as const, projectName: correctedTerms[0] ?? directProduct!.name, searchTerms: catalogTerms, missingSpecifications: [], shouldSearchCatalog: true }
      : { ...data, searchTerms: catalogTerms, shouldSearchCatalog }
    const response = responseFromAnalysis(enrichedData, model || aiConfig.model, responseProducts, interpretedMessage)
    return withSpellingNotice(await attachProjectPlan(response, enrichedData), spelling)
  },
}
