"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { getAdminSession, signInAdmin, signOutAdmin } from "@/services/auth.service"

type AdminAuthContextValue = {
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) throw new Error("useAdminAuth debe usarse dentro de AdminAuthGate")
  return context
}

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const isLoginPage = pathname === "/admin/login"

  useEffect(() => {
    let mounted = true
    getAdminSession().then((user) => { if (mounted) setAuthenticated(Boolean(user)) }).catch(() => { if (mounted) setAuthenticated(false) })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (authenticated === false && !isLoginPage) router.replace("/admin/login")
    if (authenticated === true && isLoginPage) router.replace("/admin")
  }, [authenticated, isLoginPage, router])

  async function login(email: string, password: string) {
    const accepted = await signInAdmin(email, password)
    if (!accepted) return false
    setAuthenticated(true)
    router.replace("/admin")
    return true
  }

  async function logout() {
    await signOutAdmin()
    setAuthenticated(false)
    router.replace("/admin/login")
  }

  const context = { login, logout }

  if (authenticated === null || (authenticated && isLoginPage) || (!authenticated && !isLoginPage)) {
    return <div className="flex min-h-screen items-center justify-center bg-muted/30 text-sm text-muted-foreground">Cargando panel administrativo...</div>
  }

  return (
    <AdminAuthContext.Provider value={context}>
      {isLoginPage ? children : (
        <div className="flex min-h-screen min-w-0 flex-col bg-muted/30 lg:flex-row">
          <AdminSidebar onLogout={logout} />
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      )}
    </AdminAuthContext.Provider>
  )
}
