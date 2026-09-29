import { z } from "zod"
import { aiProvider } from "@/server/modules/ai/ai.provider"
import { imageAnalysisSchema } from "@/server/modules/ai/ai.schema"

const VISION_PROMPT = `Eres el analizador visual de FerreBot para la ferretería FERREIA.
Analiza la imagen de forma prudente y responde únicamente con el JSON solicitado.

Reglas:
- Primero clasifica imagePresentation. Una marca escrita con un símbolo gráfico es logo_or_text, aunque el símbolo se parezca a una caja de herramientas.
- Solo photo, product_render o technical_drawing pueden contener un objeto relevante para buscar en el catálogo.
- Clasifica como furniture_project si muestra un mueble, estructura o proyecto manual que una persona podría construir.
- Clasifica como tool_or_product si muestra una herramienta, material, consumible o producto identificable.
- containsRelevantObject solo puede ser true cuando realmente se vea el objeto físico, un mueble, material, herramienta o una representación clara de un proyecto.
- Si la imagen solo contiene un logotipo, nombre de marca, texto, ícono, captura de una interfaz o decoración gráfica, usa other y containsRelevantObject=false. No interpretes el símbolo de un logotipo como un objeto físico.
- Usa other o uncertain cuando no sea relevante o la imagen no permita identificarlo.
- No inventes marca, modelo, medidas, materiales ni texto que no sean visibles.
- No afirmes que es exactamente un producto del catálogo; genera términos de búsqueda del objeto visible para encontrar candidatos y no uses un logotipo aislado como producto.
- Si es un proyecto manual, no estimes cantidades sin medidas y solicita solo dimensiones, material o acabado faltantes.
- Nunca solicites presupuesto ni cuánto quiere gastar la persona.
- Para fabricar aparatos electrónicos usa out_of_scope; un mueble para un televisor sí es manual_project.
- La confianza debe estar entre 0 y 1.`

function imageBase64(dataUrl: string) {
  return dataUrl.slice(dataUrl.indexOf(",") + 1)
}

export const aiVision = {
  async analyze(message: string, dataUrl: string) {
    const schema = z.toJSONSchema(imageAnalysisSchema)
    return aiProvider.structuredChat([
      { role: "system", content: VISION_PROMPT },
      {
        role: "user",
        content: `Solicitud del cliente: ${message || "Analiza la imagen y busca productos relacionados."}\nEsquema requerido: ${JSON.stringify(schema)}`,
        images: [imageBase64(dataUrl)],
      },
    ], imageAnalysisSchema)
  },
}
