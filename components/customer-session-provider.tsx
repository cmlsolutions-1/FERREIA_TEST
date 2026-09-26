"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { getCustomerSession, loginCustomer, logoutCustomer, registerCustomer, type CustomerAccount } from "@/services/customers.service"

type RegisterInput = { name: string; document: string; email: string; phone: string; password: string }
type CustomerSessionContextValue = {
  user: CustomerAccount | null
  login: (email: string, password: string) => Promise<string | null>
  register: (input: RegisterInput) => Promise<string | null>
  logout: () => Promise<void>
}
const CustomerSessionContext = createContext<CustomerSessionContextValue | null>(null)

export function CustomerSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerAccount | null>(null)
  useEffect(() => { let active = true; getCustomerSession().then((result) => { if (active) setUser(result.data) }).catch(() => {}); return () => { active = false } }, [])
  async function login(email: string, password: string) { try { const result = await loginCustomer(email, password); setUser(result.data); return null } catch (error) { return error instanceof Error ? error.message : "No fue posible ingresar" } }
  async function register(input: RegisterInput) { try { const result = await registerCustomer(input); setUser(result.data); return null } catch (error) { return error instanceof Error ? error.message : "No fue posible crear la cuenta" } }
  async function logout() { await logoutCustomer(); setUser(null) }
  const value = useMemo(() => ({ user, login, register, logout }), [user])
  return <CustomerSessionContext.Provider value={value}>{children}</CustomerSessionContext.Provider>
}

export function useCustomerSession() { const context = useContext(CustomerSessionContext); if (!context) throw new Error("useCustomerSession debe usarse dentro de CustomerSessionProvider"); return context }
