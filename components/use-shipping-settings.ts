"use client"

import { useEffect, useState } from "react"
import { initialShippingSettings, SHIPPING_UPDATED_EVENT } from "@/lib/shipping"
import { getShippingSettings } from "@/services/shipping.service"

export function useShippingSettings() {
  const [settings, setSettings] = useState(initialShippingSettings)
  useEffect(() => {
    const reload = () => { getShippingSettings().then((result) => setSettings(result.data)).catch(() => {}) }
    reload()
    window.addEventListener(SHIPPING_UPDATED_EVENT, reload)
    return () => { window.removeEventListener(SHIPPING_UPDATED_EVENT, reload) }
  }, [])
  return settings
}
