export const SHIPPING_SETTINGS_KEY = "ferreia-shipping-settings-v1"
export const SHIPPING_UPDATED_EVENT = "ferreia:shipping-settings-updated"

export type ShippingMethodId = "standard" | "express"
export type FreeShippingMode = "any" | "all"

export type ShippingZone = {
  id: string
  name: string
  departments: string[]
  surcharge: number
  active: boolean
}

export type ShippingSettings = {
  enabled: boolean
  freeShipping: {
    enabled: boolean
    byAmount: boolean
    minimumAmount: number
    byQuantity: boolean
    minimumQuantity: number
    mode: FreeShippingMode
  }
  standard: { active: boolean; baseCost: number; minDays: number; maxDays: number; freeShippingEligible: boolean }
  express: { active: boolean; baseCost: number; minDays: number; maxDays: number; freeShippingEligible: boolean }
  zones: ShippingZone[]
}

export const initialShippingSettings: ShippingSettings = {
  enabled: true,
  freeShipping: { enabled: true, byAmount: true, minimumAmount: 150000, byQuantity: true, minimumQuantity: 12, mode: "any" },
  standard: { active: true, baseCost: 12000, minDays: 3, maxDays: 5, freeShippingEligible: true },
  express: { active: true, baseCost: 18000, minDays: 1, maxDays: 2, freeShippingEligible: false },
  zones: [
    { id: "zone-bogota", name: "Bogotá D.C.", departments: ["Bogotá D.C."], surcharge: 0, active: true },
    { id: "zone-principal", name: "Ciudades principales", departments: ["Antioquia", "Atlántico", "Valle del Cauca", "Santander", "Cundinamarca"], surcharge: 3000, active: true },
    { id: "zone-national", name: "Cobertura nacional", departments: [], surcharge: 7000, active: true },
  ],
}

export function readShippingSettings(): ShippingSettings {
  if (typeof window === "undefined") return initialShippingSettings
  try {
    const stored = localStorage.getItem(SHIPPING_SETTINGS_KEY)
    return stored ? { ...initialShippingSettings, ...JSON.parse(stored) as ShippingSettings } : initialShippingSettings
  } catch { return initialShippingSettings }
}

export function findShippingZone(settings: ShippingSettings, department?: string) {
  if (!department) return undefined
  return settings.zones.find((zone) => zone.active && zone.departments.includes(department)) ?? settings.zones.find((zone) => zone.active && zone.departments.length === 0)
}

export function qualifiesForFreeShipping(settings: ShippingSettings, subtotal: number, quantity: number) {
  const rule = settings.freeShipping
  if (!settings.enabled || !rule.enabled) return false
  const checks: boolean[] = []
  if (rule.byAmount) checks.push(subtotal >= rule.minimumAmount)
  if (rule.byQuantity) checks.push(quantity >= rule.minimumQuantity)
  if (!checks.length) return false
  return rule.mode === "all" ? checks.every(Boolean) : checks.some(Boolean)
}

export function calculateShipping(settings: ShippingSettings, input: { subtotal: number; quantity: number; method?: ShippingMethodId; department?: string }) {
  const methodId = input.method ?? "standard"
  const method = settings[methodId]
  const zone = findShippingZone(settings, input.department)
  const available = settings.enabled && method.active
  const free = method.freeShippingEligible && qualifiesForFreeShipping(settings, input.subtotal, input.quantity)
  const cost = !available || free ? 0 : Math.max(0, method.baseCost + (zone?.surcharge ?? 0))
  return { cost, free: available && free, available, methodId, method, zone, exact: Boolean(input.department) }
}

export function freeShippingProgress(settings: ShippingSettings, subtotal: number, quantity: number) {
  const rule = settings.freeShipping
  const amountRemaining = rule.byAmount ? Math.max(0, rule.minimumAmount - subtotal) : 0
  const quantityRemaining = rule.byQuantity ? Math.max(0, rule.minimumQuantity - quantity) : 0
  return { amountRemaining, quantityRemaining, qualified: qualifiesForFreeShipping(settings, subtotal, quantity) }
}
