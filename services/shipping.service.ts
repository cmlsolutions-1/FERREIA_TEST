import type { ShippingSettings } from "@/lib/shipping"
import { apiRequest } from "@/services/api-client"
export async function getShippingSettings() { return apiRequest<ShippingSettings>("/api/shipping") }
export async function saveShippingSettings(input: ShippingSettings) { return apiRequest<ShippingSettings>("/api/shipping", { method: "PUT", body: JSON.stringify(input) }) }
