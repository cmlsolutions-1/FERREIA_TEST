import { z } from "zod"

export const advisorIntentSchema = z.enum([
  "manual_project",
  "finished_product_search",
  "product_advice",
  "out_of_scope",
])

export const advisorHistoryMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2_000),
})

export const advisorImageSchema = z.object({
  name: z.string().trim().min(1).max(180),
  dataUrl: z.string().max(8_000_000).refine(
    (value) => /^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(value),
    "La imagen debe ser JPG, PNG o WEBP",
  ),
})

export const advisorRequestSchema = z.object({
  message: z.string().trim().max(2_000).default(""),
  history: z.array(advisorHistoryMessageSchema).max(8).default([]),
  image: advisorImageSchema.optional(),
}).superRefine((value, context) => {
  if (value.message.length < 3 && !value.image) {
    context.addIssue({ code: "custom", path: ["message"], message: "Escribe una solicitud o adjunta una imagen" })
  }
})

export const imageAnalysisSchema = z.object({
  imageType: z.enum(["furniture_project", "tool_or_product", "other", "uncertain"]),
  imagePresentation: z.enum(["photo", "product_render", "technical_drawing", "logo_or_text", "interface_screenshot", "uncertain"]),
  containsRelevantObject: z.boolean(),
  intent: advisorIntentSchema,
  detectedObject: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(600),
  confidence: z.number().min(0).max(1),
  visibleText: z.array(z.string().trim().min(1).max(160)).max(12),
  materialsObserved: z.array(z.string().trim().min(1).max(120)).max(8),
  searchTerms: z.array(z.string().trim().min(1).max(80)).max(8),
  missingSpecifications: z.array(z.string().trim().min(1).max(120)).max(8),
  shouldSearchCatalog: z.boolean(),
})

export const visionResultSchema = imageAnalysisSchema.pick({
  imageType: true,
  imagePresentation: true,
  detectedObject: true,
  confidence: true,
  visibleText: true,
  materialsObserved: true,
})

export const projectAnalysisSchema = z.object({
  intent: advisorIntentSchema,
  normalizedRequest: z.string().trim().min(1).max(500),
  projectName: z.string().trim().min(1).max(120),
  searchTerms: z.array(z.string().trim().min(1).max(80)).max(8),
  knownSpecifications: z.array(z.object({
    name: z.string().trim().min(1).max(80),
    value: z.string().trim().min(1).max(120),
  })).max(12),
  missingSpecifications: z.array(z.string().trim().min(1).max(120)).max(8),
  shouldSearchCatalog: z.boolean(),
  summary: z.string().trim().min(1).max(500),
})

export const catalogProductSchema = z.object({
  id: z.string(),
  sku: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  categoryName: z.string(),
  subcategory: z.string(),
  productType: z.enum(["TOOL", "MATERIAL", "CONSUMABLE", "FINISHED_PRODUCT"]),
  brand: z.string(),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  image: z.string(),
  matchType: z.enum(["direct", "related"]),
})

export const projectPlanDraftSchema = z.object({
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(500),
  requirements: z.array(z.object({
    name: z.string().trim().min(1).max(140),
    productType: z.enum(["TOOL", "MATERIAL", "CONSUMABLE"]),
    purchaseQuantity: z.number().int().min(1).max(100),
    quantityDescription: z.string().trim().min(1).max(120),
    purpose: z.string().trim().min(1).max(240),
    searchTerms: z.array(z.string().trim().min(2).max(80)).min(1).max(5),
  })).max(16),
  steps: z.array(z.string().trim().min(1).max(280)).max(10),
  assumptions: z.array(z.string().trim().min(1).max(240)).max(8),
  safetyNotes: z.array(z.string().trim().min(1).max(240)).max(8),
})

const unavailablePlanItemSchema = z.object({
  name: z.string(),
  quantityDescription: z.string(),
  purpose: z.string(),
})

const optionalPlanItemSchema = z.object({
  name: z.string(),
  description: z.string(),
  followUpPrompt: z.string(),
})

export const projectPlanSchema = z.object({
  title: z.string(),
  summary: z.string(),
  isEstimate: z.literal(true),
  isBasic: z.boolean(),
  currency: z.literal("COP"),
  total: z.number().nonnegative(),
  suppliesTotal: z.number().nonnegative(),
  items: z.array(z.object({
    product: catalogProductSchema,
    quantity: z.number().int().positive(),
    requirement: z.string(),
    purpose: z.string(),
    note: z.string(),
    unitPrice: z.number().nonnegative(),
    subtotal: z.number().nonnegative(),
  })),
  recommendedTools: z.array(z.object({
    name: z.string(),
    purpose: z.string(),
    note: z.string(),
  })),
  unavailable: z.array(unavailablePlanItemSchema),
  optionalAddOns: z.array(optionalPlanItemSchema),
  steps: projectPlanDraftSchema.shape.steps,
  assumptions: projectPlanDraftSchema.shape.assumptions,
  safetyNotes: projectPlanDraftSchema.shape.safetyNotes,
})

export const projectAdvisorResponseSchema = z.object({
  status: z.enum(["blocked", "needs_information", "ready_for_catalog"]),
  intent: advisorIntentSchema,
  assistantMessage: z.string(),
  projectName: z.string(),
  searchTerms: z.array(z.string()),
  knownSpecifications: z.array(z.object({ name: z.string(), value: z.string() })),
  missingSpecifications: z.array(z.string()),
  shouldSearchCatalog: z.boolean(),
  source: z.enum(["business_policy", "ollama"]),
  model: z.string().nullable(),
  catalog: z.object({
    searched: z.boolean(),
    queryTerms: z.array(z.string()),
    products: z.array(catalogProductSchema),
  }),
  vision: visionResultSchema.optional(),
  plan: projectPlanSchema.optional(),
})

export type AdvisorRequest = z.infer<typeof advisorRequestSchema>
export type AdvisorHistoryMessage = z.infer<typeof advisorHistoryMessageSchema>
export type AdvisorImage = z.infer<typeof advisorImageSchema>
export type VisionResult = z.infer<typeof visionResultSchema>
export type ProjectAnalysis = z.infer<typeof projectAnalysisSchema>
export type CatalogProduct = z.infer<typeof catalogProductSchema>
export type ProjectPlanDraft = z.infer<typeof projectPlanDraftSchema>
export type ProjectPlan = z.infer<typeof projectPlanSchema>
export type ProjectAdvisorResponse = z.infer<typeof projectAdvisorResponseSchema>
