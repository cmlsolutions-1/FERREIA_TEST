"use client"

import { useEffect, useState } from "react"
import { initialShippingSettings, readShippingSettings, SHIPPING_SETTINGS_KEY, SHIPPING_UPDATED_EVENT } from "@/lib/shipping"

export function useShippingSettings() {
  const [settings, setSettings] = useState(initialShippingSettings)
  useEffect(() => {
    const reload = () => setSettings(readShippingSettings())
    reload()
    const storage = (event: StorageEvent) => { if (event.key === SHIPPING_SETTINGS_KEY) reload() }
    window.addEventListener("storage", storage)
    window.addEventListener(SHIPPING_UPDATED_EVENT, reload)
    return () => { window.removeEventListener("storage", storage); window.removeEventListener(SHIPPING_UPDATED_EVENT, reload) }
  }, [])
  return settings
}
