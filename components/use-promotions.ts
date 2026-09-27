"use client"

import { useEffect, useState } from "react"
import { promotionBySku, PROMOTIONS_UPDATED_EVENT, type Promotion } from "@/lib/promotions"
import { getPromotions } from "@/services/promotions.service"

export function usePromotionsBySku() {
  const [promotions, setPromotions] = useState<Record<string, Promotion>>({})
  useEffect(() => {
    let active = true
    const load = () => getPromotions().then((result) => { if (active) setPromotions(promotionBySku(result.data)) }).catch(() => {})
    void load()
    window.addEventListener(PROMOTIONS_UPDATED_EVENT, load)
    return () => { active = false; window.removeEventListener(PROMOTIONS_UPDATED_EVENT, load) }
  }, [])
  return promotions
}
