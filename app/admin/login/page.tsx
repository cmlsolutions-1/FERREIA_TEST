"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { Eye, EyeOff, LockKeyhole, LogIn, Store } from "lucide-react"
import { useAdminAuth } from "@/components/admin/admin-auth-gate"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ADMIN_ACCOUNT } from "@/lib/admin-account"

export default function AdminLoginPage() {
  const { login } = useAdminAuth()
  const [email, setEmail] = useState<string>(ADMIN_ACCOUNT.email)
  const [password, setPassword] = useState<string>(ADMIN_ACCOUNT.password)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!login(email, password)) setError("El correo o la contraseña no coinciden.")
    else setError("")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-primary">Panel administrativo</h1>
          <p className="mt-2 text-sm text-muted-foreground">Ingresa para gestionar FERREIA ERP.</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-email">Correo electrónico</Label>
                <Input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-password">Contraseña</Label>
                <div className="relative">
                  <Input id="admin-password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="pr-10" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1 top-1/2 flex h-7 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
              <Button type="submit" className="w-full"><LogIn className="h-4 w-4" />Ingresar al panel</Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">Acceso de demostración: {ADMIN_ACCOUNT.email} / {ADMIN_ACCOUNT.password}</p>
        <Button asChild variant="ghost" className="mx-auto mt-3 flex text-primary"><Link href="/"><Store className="h-4 w-4" />Volver a la tienda</Link></Button>
      </div>
    </main>
  )
}
