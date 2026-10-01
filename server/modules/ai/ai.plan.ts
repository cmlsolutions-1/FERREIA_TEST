import { z } from "zod"
import { aiProvider } from "@/server/modules/ai/ai.provider"
import {
  projectPlanDraftSchema,
  type ProjectAnalysis,
  type ProjectPlanDraft,
} from "@/server/modules/ai/ai.schema"

const PROJECT_PLAN_PROMPT = `Eres el planificador de proyectos manuales de FERREIA.
Recibirás un proyecto ya definido y sus especificaciones. Tu función es describir sus necesidades, no elegir productos concretos.

Reglas obligatorias:
- requirements debe contener únicamente materiales, consumibles y herramientas realmente útiles para construir el proyecto.
- Cada requirement debe describir una sola necesidad concreta y searchTerms debe contener nombres genéricos precisos para buscarla en una ferretería.
- Para un mueble básico revisa de forma explícita: material estructural, fijaciones o herrajes, medición, corte, perforación y montaje. Incluye cada necesidad aplicable y no omitas herramientas indispensables.
- La pintura, el barniz, la laca, el sellador, las ruedas, la iluminación y los adornos son mejoras opcionales. No los incluyas en requirements salvo que la persona los haya solicitado expresamente en las especificaciones.
- Si no se especifica acabado, asume el proyecto armado y funcional, sin pintura ni barniz. El acabado no es un dato obligatorio para calcular la versión básica.
- Un proyecto de mueble normalmente requiere entre 5 y 12 necesidades separadas. No agrupes varias herramientas en un solo requirement.
- No menciones identificadores, productos concretos, marcas, precios ni existencias.
- purchaseQuantity representa unidades de compra aproximadas; quantityDescription explica la necesidad técnica en lenguaje humano.
- Para herramientas reutilizables normalmente usa cantidad 1.
- Las herramientas reutilizables, sean manuales o eléctricas, solo se recomiendan para ejecutar el trabajo: nunca forman parte del costo del objeto construido. Marca esas necesidades con productType TOOL para mostrarlas aparte sin precio.
- No selecciones productos terminados como si fueran materiales de construcción.
- Las cantidades son una estimación prudente basada en las especificaciones disponibles. Explica supuestos importantes.
- No incluyas mano de obra, transporte ni productos no solicitados.
- Nunca preguntes presupuesto ni ajustes el plan a una cantidad de dinero.
- Los pasos son orientación general; incluye advertencias de seguridad cuando haya corte, perforación, electricidad o cargas.
- Responde únicamente con el JSON solicitado.`

const normalize = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()

function specificationValue(specifications: Array<{ name: string; value: string }>, pattern: RegExp) {
  return specifications.find(({ name }) => pattern.test(normalize(name)))?.value
}

function specificationValues(specifications: Array<{ name: string; value: string }>, pattern: RegExp) {
  return specifications.filter(({ name }) => pattern.test(normalize(name))).map(({ value }) => value)
}

function baselinePlan(
  analysis: ProjectAnalysis,
  knownSpecifications: Array<{ name: string; value: string }>,
): ProjectPlanDraft {
  const projectText = normalize(`${analysis.projectName} ${analysis.normalizedRequest}`)
  const isFurniture = /mesa|armario|alacena|mueble|repis|gabinete|biblioteca|escritorio/.test(projectText)
  const material = specificationValue(knownSpecifications, /material|madera|mdf|melamina|metal|acero|aluminio/) ?? "material estructural"
  const dimensions = specificationValues(knownSpecifications, /dimension|medida|ancho|alto|largo|longitud|profundidad|grosor|espesor/).join(" × ")
  const requestedFinish = specificationValue(knownSpecifications, /acabado|color|barniz|pintura|mate|brillante/)
  const finish = requestedFinish && !/\bsin\s+(?:pintura|barniz|acabado)|\bcrudo\b|\bsin terminar\b/i.test(normalize(requestedFinish))
    ? requestedFinish
    : undefined
  const requirements: ProjectPlanDraft["requirements"] = []

  if (isFurniture) {
    requirements.push(
      {
        name: material,
        productType: "MATERIAL",
        purchaseQuantity: 1,
        quantityDescription: dimensions ? `Despiece para las medidas ${dimensions}` : "Cantidad según el despiece final",
        purpose: "Construir la estructura principal del mueble",
        searchTerms: [material, "tablero", "madera"],
      },
      {
        name: "Tornillos para madera",
        productType: "MATERIAL",
        purchaseQuantity: 1,
        quantityDescription: "1 caja o empaque compatible con el espesor",
        purpose: "Ensamblar la estructura y fijar sus partes",
        searchTerms: ["tornillo madera"],
      },
      {
        name: "Flexómetro o cinta métrica",
        productType: "TOOL",
        purchaseQuantity: 1,
        quantityDescription: "1 unidad",
        purpose: "Medir y marcar el despiece",
        searchTerms: ["flexometro", "cinta metrica"],
      },
      {
        name: "Sierra para madera",
        productType: "TOOL",
        purchaseQuantity: 1,
        quantityDescription: "1 unidad",
        purpose: "Realizar los cortes del material estructural",
        searchTerms: ["sierra circular", "sierra madera"],
      },
      {
        name: "Taladro",
        productType: "TOOL",
        purchaseQuantity: 1,
        quantityDescription: "1 unidad con broca apropiada",
        purpose: "Perforar y facilitar el ensamble",
        searchTerms: ["taladro", "taladro inalambrico"],
      },
      {
        name: "Martillo",
        productType: "TOOL",
        purchaseQuantity: 1,
        quantityDescription: "1 unidad",
        purpose: "Apoyar el montaje y ajuste de piezas",
        searchTerms: ["martillo"],
      },
    )

    if (finish) {
      requirements.push({
        name: finish,
        productType: "CONSUMABLE",
        purchaseQuantity: 1,
        quantityDescription: "1 unidad; confirmar rendimiento según el área",
        purpose: "Proteger y dar el acabado solicitado",
        searchTerms: [finish, "barniz madera"],
      })
    }
  }

  if (isFurniture && /armario|alacena|gabinete|puerta/.test(projectText)) {
    requirements.push({
      name: "Bisagras para mueble",
      productType: "MATERIAL",
      purchaseQuantity: 2,
      quantityDescription: "Mínimo 2 unidades por puerta; ajustar según tamaño y peso",
      purpose: "Permitir la apertura y cierre de las puertas",
      searchTerms: ["bisagra mueble", "bisagra cierre suave"],
    })
  }

  return {
    title: `Estimación para ${analysis.projectName}`,
    summary: finish
      ? "Estimación de materiales y consumibles incorporados al proyecto, incluyendo el acabado solicitado. Las herramientas necesarias se indican aparte y no se suman."
      : "Estimación para el armado básico y funcional, sin pintura, barniz ni otros acabados opcionales.",
    requirements,
    steps: isFurniture ? [
      "Verificar las medidas y preparar un despiece antes de cortar.",
      "Marcar y cortar el material estructural.",
      "Perforar previamente los puntos de fijación para evitar grietas.",
      "Ensamblar, comprobar escuadras y nivelar la estructura.",
      ...(finish ? ["Lijar, limpiar y aplicar el acabado respetando su tiempo de secado."] : []),
    ] : [],
    assumptions: knownSpecifications.map(({ name, value }) => `${name}: ${value}`).slice(0, 8),
    safetyNotes: isFurniture ? [
      "Usa protección ocular y auditiva durante el corte y la perforación.",
      "Sujeta firmemente las piezas y desconecta las herramientas antes de ajustar discos o brocas.",
    ] : [],
  }
}

function mergePlans(baseline: ProjectPlanDraft, generated: ProjectPlanDraft): ProjectPlanDraft {
  const hasControlledBaseline = baseline.requirements.length > 0
  const requirements = hasControlledBaseline ? baseline.requirements : generated.requirements
  return {
    ...generated,
    summary: hasControlledBaseline ? baseline.summary : generated.summary,
    requirements: requirements.slice(0, 16),
    steps: hasControlledBaseline ? baseline.steps : generated.steps,
    assumptions: [...new Set([...generated.assumptions, ...baseline.assumptions])].slice(0, 8),
    safetyNotes: hasControlledBaseline ? baseline.safetyNotes : generated.safetyNotes,
  }
}

export const aiPlanner = {
  async create(
    analysis: ProjectAnalysis,
    knownSpecifications: Array<{ name: string; value: string }>,
  ) {
    const baseline = baselinePlan(analysis, knownSpecifications)
    const schema = z.toJSONSchema(projectPlanDraftSchema)
    try {
      const result = await aiProvider.structuredChat([
        { role: "system", content: PROJECT_PLAN_PROMPT },
        {
          role: "user",
          content: [
            `PROYECTO: ${analysis.projectName}`,
            `SOLICITUD: ${analysis.normalizedRequest}`,
            `ESPECIFICACIONES: ${JSON.stringify(knownSpecifications)}`,
            `ESQUEMA_REQUERIDO: ${JSON.stringify(schema)}`,
          ].join("\n"),
        },
      ], projectPlanDraftSchema, { maxOutputTokens: 850 })
      return { ...result, data: mergePlans(baseline, result.data) }
    } catch {
      return { data: baseline, model: null }
    }
  },
}
