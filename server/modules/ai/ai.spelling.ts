export type SpellingCorrection = { original: string; corrected: string }
export type SpellingResolution = { message: string; corrections: SpellingCorrection[] }

const IGNORED_WORDS = new Set([
  "algo", "algun", "alguna", "como", "comprar", "con", "cual", "cuando", "dame", "del", "donde",
  "el", "ella", "ellos", "en", "encontrar", "esta", "este", "hacer", "la", "las", "lo", "los",
  "me", "mi", "necesito", "para", "por", "producto", "productos", "que", "quiero", "sin", "tengo",
  "una", "uno", "unos", "unas", "usar", "uso", "y",
])

const normalize = (value: string) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()

const words = (value: string) => normalize(value).match(/[a-z0-9]+/g) ?? []

function distance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let row = 1; row <= left.length; row++) {
    let diagonal = previous[0]
    previous[0] = row
    for (let column = 1; column <= right.length; column++) {
      const above = previous[column]
      previous[column] = Math.min(
        previous[column] + 1,
        previous[column - 1] + 1,
        diagonal + (left[row - 1] === right[column - 1] ? 0 : 1),
      )
      diagonal = above
    }
  }
  return previous[right.length]
}

function vocabularyFrom(values: string[]) {
  const frequency = new Map<string, number>()
  for (const word of values.flatMap(words)) {
    if (word.length < 4 || IGNORED_WORDS.has(word) || /^\d+$/.test(word)) continue
    frequency.set(word, (frequency.get(word) ?? 0) + 1)
  }
  return frequency
}

function grammaticalGenderVariant(left: string, right: string) {
  if (left.length !== right.length || left.slice(0, -1) !== right.slice(0, -1)) return false
  return new Set([left.at(-1), right.at(-1)]).size === 2 && [left.at(-1), right.at(-1)].every((ending) => ending === "a" || ending === "o")
}

export function resolveCatalogSpelling(message: string, catalogValues: string[]): SpellingResolution {
  const vocabulary = vocabularyFrom(catalogValues)
  const inputWords = [...new Set(words(message))]
  const corrections: SpellingCorrection[] = []

  for (const input of inputWords) {
    if (input.length < 5 || IGNORED_WORDS.has(input) || vocabulary.has(input)) continue
    const maximumDistance = input.length >= 8 ? 2 : 1
    const candidates = [...vocabulary.entries()]
      .filter(([candidate]) => candidate[0] === input[0] && Math.abs(candidate.length - input.length) <= maximumDistance)
      .map(([candidate, frequency]) => {
        const edits = distance(input, candidate)
        return { candidate, edits, similarity: 1 - edits / Math.max(input.length, candidate.length), frequency }
      })
      .filter(({ candidate, edits, similarity }) => !grammaticalGenderVariant(input, candidate) && edits > 0 && edits <= maximumDistance && similarity >= 0.78)
      .sort((left, right) => left.edits - right.edits || right.similarity - left.similarity || right.frequency - left.frequency || left.candidate.localeCompare(right.candidate))

    const best = candidates[0]
    if (!best) continue
    const competing = candidates[1]
    if (competing && competing.edits === best.edits && competing.similarity === best.similarity && competing.frequency === best.frequency) continue
    corrections.push({ original: input, corrected: best.candidate })
  }

  if (corrections.length === 0) return { message, corrections }
  const correctionMap = new Map(corrections.map((correction) => [correction.original, correction.corrected]))
  const correctedMessage = message.replace(/\p{L}[\p{L}\p{N}]*/gu, (original) => correctionMap.get(normalize(original)) ?? original)
  return { message: correctedMessage, corrections }
}
