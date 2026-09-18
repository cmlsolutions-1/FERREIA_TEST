"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DEFAULT_MARKUP_PERCENT, PRICING_SETTINGS_KEY, readSuggestedMarkup } from "@/lib/cost-pricing"

export function PricingSettings() {
  const [percent, setPercent] = useState(DEFAULT_MARKUP_PERCENT)
  const [saved, setSaved] = useState(false)

  useEffect(() => setPercent(readSuggestedMarkup()), [])

  function save() {
    if (!Number.isFinite(percent) || percent < 0 || percent > 1000) return
    localStorage.setItem(PRICING_SETTINGS_KEY, String(percent))
    setSaved(true)
  }

  return <Card>
    <CardHeader><CardTitle>Precio sugerido de artículos</CardTitle></CardHeader>
    <CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground">Porcentaje de ganancia sugerido sobre el costo al crear artículos. Puedes cambiarlo en cada producto; no modifica los existentes.</p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5"><Label htmlFor="suggested-markup">Ganancia sugerida sobre costo (%)</Label><Input id="suggested-markup" type="number" min="0" max="1000" step="0.01" value={percent} onChange={(event) => { setPercent(Number(event.target.value)); setSaved(false) }} className="w-44" /></div>
        <Button type="button" onClick={save}>Guardar porcentaje</Button>
      </div>
      {saved && <p role="status" className="text-sm text-emerald-700">Porcentaje guardado para nuevos artículos.</p>}
    </CardContent>
  </Card>
}
