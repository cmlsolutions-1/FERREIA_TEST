"use client"

import { useState } from "react"
import type { ComponentType } from "react"
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  PackagePlus,
  Plus,
  UserPlus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"

type Field =
  | {
      kind: "input"
      id: string
      label: string
      placeholder?: string
      type?: string
      defaultValue?: string
      required?: boolean
    }
  | {
      kind: "textarea"
      id: string
      label: string
      placeholder?: string
      defaultValue?: string
      required?: boolean
    }
  | {
      kind: "select"
      id: string
      label: string
      placeholder: string
      options: string[]
      defaultValue?: string
      required?: boolean
    }

type AdminActionSheetProps = {
  buttonLabel: string
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  storageKey: string
  successMessage: string
  fields: Field[]
}

function AdminActionSheet({
  buttonLabel,
  title,
  description,
  icon: Icon,
  storageKey,
  successMessage,
  fields,
}: AdminActionSheetProps) {
  const [saved, setSaved] = useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget).entries())
    const current = JSON.parse(localStorage.getItem(storageKey) || "[]") as unknown[]

    localStorage.setItem(
      storageKey,
      JSON.stringify([
        {
          ...data,
          id: `${storageKey}-${Date.now()}`,
          createdAt: new Date().toISOString(),
          status: "draft",
        },
        ...current,
      ]),
    )
    setSaved(true)
    event.currentTarget.reset()
  }

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button size="sm" />
        }
      >
        <Icon className="mr-2 h-4 w-4" />
        {buttonLabel}
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 px-4 pb-4">
          {saved && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <FormField key={field.id} field={field} />
            ))}
          </div>

          <SheetFooter className="px-0 pb-0">
            <Button type="submit" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Guardar borrador
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function FormField({ field }: { field: Field }) {
  if (field.kind === "textarea") {
    return (
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={field.id}>{field.label}</Label>
        <Textarea
          id={field.id}
          name={field.id}
          placeholder={field.placeholder}
          defaultValue={field.defaultValue}
          required={field.required}
        />
      </div>
    )
  }

  if (field.kind === "select") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={field.id}>{field.label}</Label>
        <Select name={field.id} defaultValue={field.defaultValue} required={field.required}>
          <SelectTrigger id={field.id} className="w-full">
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={field.id}>{field.label}</Label>
      <Input
        id={field.id}
        name={field.id}
        type={field.type}
        placeholder={field.placeholder}
        defaultValue={field.defaultValue}
        required={field.required}
      />
    </div>
  )
}

export function NewPurchaseOrderAction() {
  return (
    <AdminActionSheet
      buttonLabel="Nueva orden de compra"
      title="Nueva orden de compra"
      description="Registra una solicitud inicial para proveedor y recepción de mercancía."
      icon={Plus}
      storageKey="ferreia-admin-purchase-orders"
      successMessage="Orden de compra guardada como borrador local."
      fields={[
        { kind: "input", id: "orden", label: "Número de orden", defaultValue: "OC-2042", required: true },
        { kind: "input", id: "proveedor", label: "Proveedor", placeholder: "Distribuidora Bosch Colombia", required: true },
        { kind: "input", id: "fecha", label: "Fecha", type: "date", required: true },
        { kind: "input", id: "total", label: "Valor estimado", placeholder: "$0", required: true },
        {
          kind: "select",
          id: "estado",
          label: "Estado inicial",
          placeholder: "Selecciona estado",
          options: ["Borrador", "Enviada"],
          defaultValue: "Borrador",
          required: true,
        },
        { kind: "textarea", id: "notas", label: "Notas", placeholder: "Productos solicitados, condiciones de pago o plazo de entrega." },
      ]}
    />
  )
}

export function NewCustomerAction() {
  return (
    <AdminActionSheet
      buttonLabel="Nuevo cliente"
      title="Nuevo cliente"
      description="Agrega un cliente al CRM para ventas, pedidos y cotizaciones."
      icon={UserPlus}
      storageKey="ferreia-admin-customers"
      successMessage="Cliente guardado como borrador local."
      fields={[
        { kind: "input", id: "nombre", label: "Nombre o razón social", placeholder: "Constructora Andina S.A.S", required: true },
        {
          kind: "select",
          id: "tipo",
          label: "Tipo",
          placeholder: "Selecciona tipo",
          options: ["Persona", "Empresa"],
          defaultValue: "Persona",
          required: true,
        },
        { kind: "input", id: "documento", label: "Documento/NIT", placeholder: "900.123.456-1" },
        { kind: "input", id: "telefono", label: "Teléfono", placeholder: "+57 300 000 0000", required: true },
        { kind: "input", id: "ciudad", label: "Ciudad", placeholder: "Bogotá", required: true },
        { kind: "input", id: "correo", label: "Correo", type: "email", placeholder: "cliente@correo.com" },
      ]}
    />
  )
}

export function NewSupplierAction() {
  return (
    <AdminActionSheet
      buttonLabel="Nuevo proveedor"
      title="Nuevo proveedor"
      description="Registra proveedores para compras, cartera y catálogo de referencias."
      icon={PackagePlus}
      storageKey="ferreia-admin-suppliers"
      successMessage="Proveedor guardado como borrador local."
      fields={[
        { kind: "input", id: "nombre", label: "Proveedor", placeholder: "Distribuidora Bosch Colombia", required: true },
        { kind: "input", id: "nit", label: "NIT", placeholder: "900.123.456-1", required: true },
        { kind: "input", id: "contacto", label: "Contacto", placeholder: "+57 601 444 1100", required: true },
        { kind: "input", id: "ciudad", label: "Ciudad", placeholder: "Bogotá", required: true },
        {
          kind: "select",
          id: "categoria",
          label: "Categoría principal",
          placeholder: "Selecciona categoría",
          options: ["Herramientas", "Iluminación", "Tornillería", "Pinturas", "Seguridad industrial"],
          required: true,
        },
        { kind: "textarea", id: "condiciones", label: "Condiciones comerciales", placeholder: "Crédito, tiempos de entrega, descuentos o mínimos de compra." },
      ]}
    />
  )
}

export function NewProductActionHint() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Building2 className="h-4 w-4" />
      Producto conectado desde inventario
    </div>
  )
}
