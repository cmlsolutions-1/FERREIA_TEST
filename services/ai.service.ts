import type { AdvisorHistoryMessage, AdvisorImage, ProjectAdvisorResponse } from "@/server/modules/ai/ai.schema"
import { apiRequest } from "@/services/api-client"

export async function requestProjectAdvice(
  message: string,
  history: AdvisorHistoryMessage[] = [],
  image?: AdvisorImage,
) {
  return apiRequest<ProjectAdvisorResponse>("/api/ai/project-advisor", {
    method: "POST",
    body: JSON.stringify({ message, history: history.slice(-8), ...(image ? { image } : {}) }),
  })
}
