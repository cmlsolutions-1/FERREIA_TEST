import { z } from "zod"
import { aiCatalog } from "@/server/modules/ai/ai.catalog"
import { aiConfig } from "@/server/modules/ai/ai.config"
import { evaluateAiBusinessPolicy } from "@/server/modules/ai/ai.policy"
import { aiProvider } from "@/server/modules/ai/ai.provider"
import { aiVision } from "@/server/modules/ai/ai.vision"
import {
  imageAnalysisSchema,
  projectAnalysisSchema,
  projectAdvisorResponseSchema,
  type AdvisorRequest,
  type ProjectAdvisorResponse,
  type VisionResult,
} from "@/server/modules/ai/ai.schema"

const SYSTEM_PROMPT = `Eres el analizador de solicitudes de FerreBot, el asistente de la ferretería FERREIA.
Tu trabajo en esta etapa es clasificar y extraer información, no recomendar productos concretos.

Reglas obligatorias:
- Los proyectos manuales válidos incluyen muebles, mesas, armarios, alacenas, repisas, soportes, instalación y trabajos de ferretería.
- Fabricar aparatos electrónicos como televisores, computadores, celulares o consolas está fuera de alcance.
- "Mueble para televisor" y "soporte para televisor" sí son proyectos manuales válidos.
- Si la persona quiere construir algo, primero se deberá buscar si existe terminado en el catálogo y luego buscar materiales y herramientas.
- No inventes productos, precios, existencias, marcas ni cantidades.
- Para un proyecto manual identifica las especificaciones conocidas y pregunta únicamente las que falten, por ejemplo dimensiones, material, uso o acabado.
- Nunca solicites presupuesto, rango de precios ni cuánto quiere gastar la persona.
- Los términos de búsqueda deben ser palabras cortas útiles para consultar un catálogo de ferretería.
- Responde únicamente con el JSON solicitado.`

const placeholder = /^(n\/?a|no aplica|ninguno|ninguna|sin nombre|no especificad[oa]|sin especificar|desconocid[oa]|por definir|null|undefined|-+)$/i
const budgetQuestion = /\b(presupuesto|rango de precios?|cu[aá]nto (?:quiere|puede) gastar|dinero disponible)\b/i
const normalizeLabel = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()

const formatCop = (value: number) => new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
}).format(value)

const unique = (values: string[]) => [...new Set(values
  .map((value) => value.trim())
  .filter((value) => value.length > 0 && !placeholder.test(value)))]

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
  const knownNames = new Set(knownSpecifications.map(({ name }) => normalizeLabel(name)))
  const missing = analysis.intent === "manual_project"
    ? unique(analysis.missingSpecifications).filter((value) => (
      !budgetQuestion.test(value) && !knownNames.has(normalizeLabel(value))
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

  return projectAnalysisSchema.parse({
    intent: analysis.intent,
    normalizedRequest: currentMessage,
    projectName: analysis.detectedObject,
    searchTerms: unique([analysis.detectedObject, ...analysis.searchTerms]),
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

export const aiAgent = {
  async advise(input: AdvisorRequest): Promise<ProjectAdvisorResponse> {
    const currentMessage = input.message || "Analiza esta imagen y busca productos relacionados."
    const policy = evaluateAiBusinessPolicy(currentMessage)
    if (!policy.allowed) return blockedByPolicy(policy.message, policy.subject, policy.searchTerms)

    if (input.image) {
      const { data, model } = await aiVision.analyze(currentMessage, input.image.dataUrl)
      const supportedPresentation = ["photo", "product_render", "technical_drawing"].includes(data.imagePresentation)
      if (!supportedPresentation || !data.containsRelevantObject || data.imageType === "other" || data.imageType === "uncertain" || data.confidence < 0.35) {
        return unclearImageResponse(data, model || aiConfig.model)
      }

      const imageProjectAnalysis = projectAnalysisFromImage(data, currentMessage)
      const catalogTerms = unique(imageProjectAnalysis.searchTerms)
      const enrichedData = { ...imageProjectAnalysis, searchTerms: catalogTerms }
      const products = imageProjectAnalysis.shouldSearchCatalog
        ? await aiCatalog.search(catalogTerms)
        : []
      return responseFromAnalysis(
        enrichedData,
        model || aiConfig.model,
        products,
        currentMessage,
        visionMetadata(data),
      )
    }

    const schema = z.toJSONSchema(projectAnalysisSchema)
    const { data, model } = await aiProvider.structuredChat([
      { role: "system", content: SYSTEM_PROMPT },
      ...input.history.map(({ role, content }) => ({ role, content })),
      {
        role: "user",
        content: `Usa el contexto anterior cuando corresponda y analiza la solicitud actual. Esquema requerido: ${JSON.stringify(schema)}\nSolicitud actual: ${input.message}`,
      },
    ], projectAnalysisSchema)

    const catalogTerms = data.intent === "manual_project" && !placeholder.test(data.projectName)
      ? unique([data.projectName, ...data.searchTerms])
      : unique(data.searchTerms)
    const enrichedData = { ...data, searchTerms: catalogTerms }
    const products = data.shouldSearchCatalog ? await aiCatalog.search(catalogTerms) : []
    return responseFromAnalysis(enrichedData, model || aiConfig.model, products, currentMessage)
  },
}
