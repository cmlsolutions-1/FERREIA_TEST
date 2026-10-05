const integerFromEnv = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? "", 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export const aiConfig = {
  baseUrl: (process.env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434").replace(/\/$/, ""),
  model: process.env.OLLAMA_MODEL?.trim() || "qwen2.5vl:3b",
  timeoutMs: integerFromEnv(process.env.OLLAMA_TIMEOUT_MS, 180_000),
  contextLength: integerFromEnv(process.env.OLLAMA_CONTEXT_LENGTH, 4_096),
  maxOutputTokens: integerFromEnv(process.env.OLLAMA_MAX_OUTPUT_TOKENS, 320),
} as const
