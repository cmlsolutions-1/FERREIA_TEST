"use client"

import { useEffect, useState } from "react"
import { initialPromotions, promotionBySku, PROMOTIONS_UPDATED_EVENT, readPromotions } from "@/lib/promotions"

export function usePromotionsBySku() {
  const [promotions, setPromotions] = useState(() => promotionBySku(initialPromotions))
  useEffect(() => {
    const load = () => setPromotions(promotionBySku(readPromotions()))
    load()
    window.addEventListener(PROMOTIONS_UPDATED_EVENT, load)
    window.addEventListener("storage", load)
    return () => { window.removeEventListener(PROMOTIONS_UPDATED_EVENT, load); window.removeEventListener("storage", load) }
  }, [])
  return promotions
}
