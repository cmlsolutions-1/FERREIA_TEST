"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ADMIN_ACCOUNT, ADMIN_SESSION_KEY } from "@/lib/admin-account"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

type AdminAuthContextValue = {
  login: (email: string, password: string) => boolean
  logout: () => void
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
    try {
      setAuthenticated(localStorage.getItem(ADMIN_SESSION_KEY) === ADMIN_ACCOUNT.id)
    } catch {
      setAuthenticated(false)
    }
  }, [])

  useEffect(() => {
    if (authenticated === false && !isLoginPage) router.replace("/admin/login")
    if (authenticated === true && isLoginPage) router.replace("/admin")
  }, [authenticated, isLoginPage, router])

  function login(email: string, password: string) {
    if (email.trim().toLowerCase() !== ADMIN_ACCOUNT.email || password !== ADMIN_ACCOUNT.password) return false
    try {
      localStorage.setItem(ADMIN_SESSION_KEY, ADMIN_ACCOUNT.id)
    } catch {
      return false
    }
    setAuthenticated(true)
    router.replace("/admin")
    return true
  }

  function logout() {
    localStorage.removeItem(ADMIN_SESSION_KEY)
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
