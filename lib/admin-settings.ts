import { useEffect, useState } from "react"
import { COMPANY } from "@/lib/data"

export const ADMIN_SETTINGS_STORAGE_KEY = "toollist-admin-settings-v1"
export const ADMIN_SETTINGS_UPDATED_EVENT = "toollist:admin-settings-updated"

export type AdminSettings = {
  companyName: string
  tagline: string
  phone: string
  email: string
  address: string
  stockAlertThreshold: number
  skuPrefix: string
  taxRate: number
}

export const defaultAdminSettings: AdminSettings = {
  companyName: COMPANY.name,
  tagline: COMPANY.tagline,
  phone: COMPANY.phone,
  email: COMPANY.email,
  address: COMPANY.address,
  stockAlertThreshold: 20,
  skuPrefix: "FER",
  taxRate: 19,
}

export function readAdminSettings(): AdminSettings {
  if (typeof window === "undefined") return defaultAdminSettings
  try {
    const stored = window.localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY)
    if (!stored) return defaultAdminSettings
    const parsed = JSON.parse(stored) as Partial<AdminSettings>
    return {
      companyName: typeof parsed.companyName === "string" && parsed.companyName.trim() ? parsed.companyName : defaultAdminSettings.companyName,
      tagline: typeof parsed.tagline === "string" && parsed.tagline.trim() ? parsed.tagline : defaultAdminSettings.tagline,
      phone: typeof parsed.phone === "string" && parsed.phone.trim() ? parsed.phone : defaultAdminSettings.phone,
      email: typeof parsed.email === "string" && parsed.email.trim() ? parsed.email : defaultAdminSettings.email,
      address: typeof parsed.address === "string" && parsed.address.trim() ? parsed.address : defaultAdminSettings.address,
      stockAlertThreshold: Number.isInteger(parsed.stockAlertThreshold) && Number(parsed.stockAlertThreshold) >= 0 ? Number(parsed.stockAlertThreshold) : defaultAdminSettings.stockAlertThreshold,
      skuPrefix: typeof parsed.skuPrefix === "string" && parsed.skuPrefix.trim() ? parsed.skuPrefix.trim().toUpperCase() : defaultAdminSettings.skuPrefix,
      taxRate: typeof parsed.taxRate === "number" && parsed.taxRate >= 0 && parsed.taxRate <= 100 ? parsed.taxRate : defaultAdminSettings.taxRate,
    }
  } catch {
    return defaultAdminSettings
  }
}

export function saveAdminSettings(settings: AdminSettings) {
  window.localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  window.dispatchEvent(new CustomEvent(ADMIN_SETTINGS_UPDATED_EVENT, { detail: settings }))
}

export function useAdminSettings() {
  const [settings, setSettings] = useState(defaultAdminSettings)
  useEffect(() => {
    const refresh = () => setSettings(readAdminSettings())
    refresh()
    window.addEventListener(ADMIN_SETTINGS_UPDATED_EVENT, refresh)
    window.addEventListener("storage", refresh)
    return () => {
      window.removeEventListener(ADMIN_SETTINGS_UPDATED_EVENT, refresh)
      window.removeEventListener("storage", refresh)
    }
  }, [])
  return settings
}
