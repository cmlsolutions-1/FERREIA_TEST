"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/admin/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Building2, Save, ShieldCheck, Store, Truck } from "lucide-react"
import { PricingSettings } from "@/components/admin/pricing-settings"
import Link from "next/link"
import { defaultAdminSettings, readAdminSettings, saveAdminSettings, type AdminSettings } from "@/lib/admin-settings"

type SettingsForm = Omit<AdminSettings, "stockAlertThreshold" | "taxRate"> & {
  stockAlertThreshold: string
  taxRate: string
}

function toForm(settings: AdminSettings): SettingsForm {
  return { ...settings, stockAlertThreshold: String(settings.stockAlertThreshold), taxRate: String(settings.taxRate) }
}

export default function ConfiguracionPage() {
  const [form, setForm] = useState<SettingsForm>(() => toForm(defaultAdminSettings))
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")

  useEffect(() => setForm(toForm(readAdminSettings())), [])

  function update<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setNotice("")
    setError("")
  }

  function save() {
    const stockAlertThreshold = Number(form.stockAlertThreshold)
    const taxRate = Number(form.taxRate)
    const skuPrefix = form.skuPrefix.trim().toUpperCase()
    if (![form.companyName, form.tagline, form.phone, form.email, form.address].every((value) => value.trim())) {
      setError("Completa todos los datos de la ferretería.")
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setError("Ingresa un correo electrónico válido.")
      return
    }
    if (!Number.isInteger(stockAlertThreshold) || stockAlertThreshold < 0) {
      setError("La alerta de stock debe ser un número entero igual o mayor que cero.")
      return
    }
    if (!/^[A-Z0-9-]{2,12}$/.test(skuPrefix)) {
      setError("El prefijo SKU debe tener entre 2 y 12 letras, números o guiones.")
      return
    }
    if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
      setError("El IVA general debe estar entre 0 y 100.")
      return
    }
    const settings: AdminSettings = {
      companyName: form.companyName.trim(), tagline: form.tagline.trim(), phone: form.phone.trim(),
      email: form.email.trim(), address: form.address.trim(), stockAlertThreshold, skuPrefix, taxRate,
    }
    saveAdminSettings(settings)
    setForm(toForm(settings))
    setNotice("Configuración general guardada correctamente.")
    setError("")
  }

  return (
    <div>
      <PageHeader
        title="Configuración"
        description="Parámetros generales de tienda, inventario, envíos y permisos"
        action={
          <Button size="sm" onClick={save}>
            <Save className="mr-2 h-4 w-4" />
            Guardar cambios
          </Button>
        }
      />

      {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</p>}

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <Store className="h-5 w-5 text-accent" />
              <CardTitle>Datos de la ferretería</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="company-name">Nombre comercial</Label>
                <Input id="company-name" value={form.companyName} onChange={(event) => update("companyName", event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-tagline">Lema</Label>
                <Input id="company-tagline" value={form.tagline} onChange={(event) => update("tagline", event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-phone">Teléfono</Label>
                <Input id="company-phone" value={form.phone} onChange={(event) => update("phone", event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-email">Correo</Label>
                <Input id="company-email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="company-address">Dirección principal</Label>
                <Textarea id="company-address" value={form.address} onChange={(event) => update("address", event.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <Truck className="h-5 w-5 text-accent" />
              <CardTitle>Envíos y cobertura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Los costos, zonas, tiempos y condiciones de envío gratis se administran en su módulo dedicado y se reflejan inmediatamente en la tienda.</p>
              <Button asChild variant="outline"><Link href="/admin/envios">Abrir parametrización de envíos</Link></Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <Building2 className="h-5 w-5 text-accent" />
              <CardTitle>Inventario y compras</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="stock-alert">Alerta stock mínimo</Label>
                <Input id="stock-alert" type="number" min="0" step="1" inputMode="numeric" value={form.stockAlertThreshold} onChange={(event) => update("stockAlertThreshold", event.target.value.replace(/^0+(?=\d)/, ""))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sku-prefix">Prefijo SKU</Label>
                <Input id="sku-prefix" maxLength={12} value={form.skuPrefix} onChange={(event) => update("skuPrefix", event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tax">IVA general</Label>
                <Input id="tax" type="number" min="0" max="100" step="0.01" inputMode="decimal" value={form.taxRate} onChange={(event) => update("taxRate", event.target.value.replace(/^0+(?=\d)/, ""))} />
              </div>
            </CardContent>
          </Card>
          <PricingSettings />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-accent" />
              <CardTitle>Roles y permisos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                ["Administrador", "Acceso total al ERP y configuración"],
                ["Inventario", "Productos y bodegas"],
                ["Ventas", "Pedidos, clientes y caja POS"],
                ["Compras", "Proveedores y órdenes de compra"],
              ].map(([role, detail]) => (
                <div key={role} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{role}</p>
                    <Badge variant="secondary" className="border-0 bg-emerald-100 text-emerald-800">
                      Activo
                    </Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">{detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integraciones futuras</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                "Pasarela de pagos",
                "Transportadora para generación de guías",
                "API de imágenes en producción",
                "Facturación electrónica",
              ].map((item, index) => (
                <div key={item}>
                  <div className="flex items-center justify-between gap-3">
                    <span>{item}</span>
                    <Badge variant="secondary" className="border-0 bg-slate-100 text-slate-700">
                      Fase {index + 1}
                    </Badge>
                  </div>
                  {index < 3 && <Separator className="mt-3" />}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
