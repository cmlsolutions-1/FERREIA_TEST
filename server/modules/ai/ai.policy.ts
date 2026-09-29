type AllowedPolicy = { allowed: true }
type BlockedPolicy = {
  allowed: false
  subject: string
  message: string
  searchTerms: string[]
}

export type AiBusinessPolicy = AllowedPolicy | BlockedPolicy

const normalize = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()

const manufacturePattern = /\b(fabricar|fabrico|construir|construyo|crear|creo|hacer|hago|armar|armo|ensamblar|ensamblo|producir|produzco)\b/
const manualProjectPattern = /\b(mueble|soporte|base|mesa|repisa|gabinete|alacena|armario|estante|rack|centro de entretenimiento|organizador)\b/

const restrictedTargets = [
  { pattern: /\b(televisor|television|smart tv|tv)\b/, subject: "un televisor", searchTerms: ["televisor"] },
  { pattern: /\b(computador|computadora|ordenador|laptop|portatil)\b/, subject: "un computador", searchTerms: ["computador"] },
  { pattern: /\b(celular|telefono inteligente|smartphone|tablet)\b/, subject: "un dispositivo electrónico", searchTerms: ["celular"] },
  { pattern: /\b(consola de videojuegos|playstation|xbox|nintendo switch)\b/, subject: "una consola electrónica", searchTerms: ["consola"] },
] as const

export function evaluateAiBusinessPolicy(message: string): AiBusinessPolicy {
  const normalized = normalize(message)
  if (!manufacturePattern.test(normalized) || manualProjectPattern.test(normalized)) return { allowed: true }

  const restricted = restrictedTargets.find(({ pattern }) => pattern.test(normalized))
  if (!restricted) return { allowed: true }

  return {
    allowed: false,
    subject: restricted.subject,
    searchTerms: [...restricted.searchTerms],
    message: `Fabricar ${restricted.subject} está fuera del alcance de FerreBot porque requiere diseño y fabricación electrónica especializada. Puedo ayudarte a buscar en el catálogo productos relacionados con su instalación o uso, como soportes, tornillería y herramientas, o ayudarte a construir un mueble para ese equipo.`,
  }
}
