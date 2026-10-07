import { COMPANY } from "@/lib/data"

export const PURCHASE_REVIEWS_STORAGE_KEY = "toollist-purchase-reviews-v1"
export const LAST_CUSTOMER_ORDER_STORAGE_KEY = "toollist-last-customer-order-v1"
export const SUPPORT_CASES_STORAGE_KEY = "toollist-support-cases-v1"
export const PURCHASE_REVIEW_UPDATED_EVENT = "toollist:purchase-review-updated"

export type PurchaseReview = {
  id: string
  orderId: string
  name: string
  city: string
  comment: string
  rating: number
  createdAt: string
  verifiedPurchase: true
}

export type LastCustomerOrder = {
  id: string
  email: string
  customerName: string
  city: string
}

export type SupportCase = {
  id: string
  option: string
  subject: string
  orderId: string
  detail: string
  createdAt: string
  channel: "whatsapp"
}

export const SUPPORT_CONFIG = {
  agentName: "Valentina",
  phone: COMPANY.phone,
  whatsappNumber: COMPANY.phone.replace(/\D/g, ""),
}

function safeArray<T>(key: string) {
  if (typeof window === "undefined") return [] as T[]
  try {
    const stored = window.localStorage.getItem(key)
    const parsed: unknown = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed as T[] : []
  } catch {
    return [] as T[]
  }
}

export function readPurchaseReviews() {
  return safeArray<PurchaseReview>(PURCHASE_REVIEWS_STORAGE_KEY)
    .filter((review) => review.orderId && review.name && review.comment && review.rating >= 1 && review.rating <= 5)
}

export function purchaseReviewForOrder(orderId: string) {
  return readPurchaseReviews().find((review) => review.orderId === orderId) ?? null
}

export function savePurchaseReview(input: Omit<PurchaseReview, "id" | "createdAt" | "verifiedPurchase">) {
  const review: PurchaseReview = {
    ...input,
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `review-${Date.now()}`,
    createdAt: new Date().toISOString(),
    verifiedPurchase: true,
  }
  const next = [review, ...readPurchaseReviews().filter((item) => item.orderId !== input.orderId)]
  window.localStorage.setItem(PURCHASE_REVIEWS_STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent(PURCHASE_REVIEW_UPDATED_EVENT))
  return review
}

export function rememberLastCustomerOrder(order: LastCustomerOrder) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(LAST_CUSTOMER_ORDER_STORAGE_KEY, JSON.stringify(order))
}

export function readLastCustomerOrder(): LastCustomerOrder | null {
  if (typeof window === "undefined") return null
  try {
    const stored = window.localStorage.getItem(LAST_CUSTOMER_ORDER_STORAGE_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored) as Partial<LastCustomerOrder>
    return typeof parsed.id === "string" && typeof parsed.email === "string"
      ? {
          id: parsed.id,
          email: parsed.email,
          customerName: typeof parsed.customerName === "string" ? parsed.customerName : "",
          city: typeof parsed.city === "string" ? parsed.city : "",
        }
      : null
  } catch {
    return null
  }
}

export function saveSupportCase(input: Omit<SupportCase, "id" | "createdAt">) {
  const id = `ST-${Date.now().toString().slice(-8)}`
  const supportCase: SupportCase = { ...input, id, createdAt: new Date().toISOString() }
  const previous = safeArray<SupportCase>(SUPPORT_CASES_STORAGE_KEY)
  window.localStorage.setItem(SUPPORT_CASES_STORAGE_KEY, JSON.stringify([supportCase, ...previous].slice(0, 30)))
  return supportCase
}
