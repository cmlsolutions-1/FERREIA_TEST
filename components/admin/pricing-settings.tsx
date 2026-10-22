"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DEFAULT_MARKUP_PERCENT, PRICING_SETTINGS_KEY, readSuggestedMarkup } from "@/lib/cost-pricing"

export function PricingSettings() {
  const [percent, setPercent] = useState(String(DEFAULT_MARKUP_PERCENT))
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => setPercent(String(readSuggestedMarkup())), [])

  function save() {
    const value = Number(percent)
    if (percent.trim() === "" || !Number.isFinite(value) || value < 0 || value > 1000) {
      setError("La ganancia sugerida debe estar entre 0% y 1000%.")
      setSaved(false)
      return
    }
    localStorage.setItem(PRICING_SETTINGS_KEY, String(value))
    setPercent(String(value))
    setError("")
    setSaved(true)
  }

  return <Card>
    <CardHeader><CardTitle>Precio sugerido de artículos</CardTitle></CardHeader>
    <CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground">Porcentaje de ganancia sugerido sobre el costo al crear artículos. Puedes cambiarlo en cada producto; no modifica los existentes.</p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5"><Label htmlFor="suggested-markup">Ganancia sugerida sobre costo (%)</Label><Input id="suggested-markup" type="number" min="0" max="1000" step="0.01" inputMode="decimal" value={percent} onFocus={(event) => event.currentTarget.select()} onChange={(event) => { setPercent(event.target.value.replace(/^0+(?=\d)/, "")); setSaved(false); setError("") }} className="w-44" /></div>
        <Button type="button" onClick={save}>Guardar porcentaje</Button>
      </div>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      {saved && <p role="status" className="text-sm text-emerald-700">Porcentaje guardado para nuevos artículos.</p>}
    </CardContent>
  </Card>
}
