import { PageHeader } from "@/components/admin/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { COMPANY } from "@/lib/data"
import { Building2, Save, ShieldCheck, Store, Truck } from "lucide-react"
import { PricingSettings } from "@/components/admin/pricing-settings"
import Link from "next/link"

export default function ConfiguracionPage() {
  return (
    <div>
      <PageHeader
        title="Configuración"
        description="Parámetros generales de tienda, inventario, envíos y permisos"
        action={
          <Button size="sm">
            <Save className="mr-2 h-4 w-4" />
            Guardar cambios
          </Button>
        }
      />

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
                <Input id="company-name" defaultValue={COMPANY.name} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-tagline">Lema</Label>
                <Input id="company-tagline" defaultValue={COMPANY.tagline} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-phone">Teléfono</Label>
                <Input id="company-phone" defaultValue={COMPANY.phone} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company-email">Correo</Label>
                <Input id="company-email" defaultValue={COMPANY.email} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="company-address">Dirección principal</Label>
                <Textarea id="company-address" defaultValue={COMPANY.address} />
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
                <Input id="stock-alert" defaultValue="20 unidades" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sku-prefix">Prefijo SKU</Label>
                <Input id="sku-prefix" defaultValue="FER" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tax">IVA general</Label>
                <Input id="tax" defaultValue="19%" />
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
