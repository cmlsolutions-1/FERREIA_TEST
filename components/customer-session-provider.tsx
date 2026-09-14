"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

export const CUSTOMER_ACCOUNTS_KEY = "ferreia-customer-accounts-v1"
export const CUSTOMER_SESSION_KEY = "ferreia-customer-session-v1"

export type CustomerAccount = {
  id: string
  name: string
  document: string
  email: string
  phone: string
  passwordHash: string
  createdAt?: string
}

type RegisterInput = Omit<CustomerAccount, "id" | "passwordHash"> & { password: string }

type CustomerSessionContextValue = {
  user: CustomerAccount | null
  accounts: CustomerAccount[]
  login: (email: string, password: string) => string | null
  register: (input: RegisterInput) => string | null
  logout: () => void
}

const demoAccount: CustomerAccount = {
  id: "USR-001",
  name: "Andrea Gómez",
  document: "52234567",
  email: "andrea@ejemplo.com",
  phone: "+57 310 555 0188",
  passwordHash: hashPassword("Ferreia123"),
  createdAt: "2026-01-15T14:00:00.000Z",
}

const CustomerSessionContext = createContext<CustomerSessionContextValue | null>(null)

function hashPassword(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function readAccounts() {
  try {
    const stored = localStorage.getItem(CUSTOMER_ACCOUNTS_KEY)
    if (!stored) {
      localStorage.setItem(CUSTOMER_ACCOUNTS_KEY, JSON.stringify([demoAccount]))
      return [demoAccount]
    }
    return JSON.parse(stored) as CustomerAccount[]
  } catch {
    return [demoAccount]
  }
}

export function CustomerSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerAccount | null>(null)
  const [accounts, setAccounts] = useState<CustomerAccount[]>([demoAccount])

  useEffect(() => {
    function syncSession() {
      const storedAccounts = readAccounts()
      const sessionId = localStorage.getItem(CUSTOMER_SESSION_KEY)
      setAccounts(storedAccounts)
      setUser(storedAccounts.find((account) => account.id === sessionId) ?? null)
    }
    syncSession()
    function handleStorage(event: StorageEvent) {
      if (event.key === CUSTOMER_ACCOUNTS_KEY || event.key === CUSTOMER_SESSION_KEY) syncSession()
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  function login(email: string, password: string) {
    const storedAccounts = readAccounts()
    const account = storedAccounts.find(
      (item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.passwordHash === hashPassword(password),
    )
    if (!account) return "El correo o la contraseña no coinciden."
    localStorage.setItem(CUSTOMER_SESSION_KEY, account.id)
    setAccounts(storedAccounts)
    setUser(account)
    return null
  }

  function register(input: RegisterInput) {
    const accounts = readAccounts()
    const email = input.email.trim().toLowerCase()
    if (input.name.trim().length < 3) return "Escribe tu nombre completo."
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Escribe un correo electrónico válido."
    if (accounts.some((account) => account.email.toLowerCase() === email)) return "Ya existe una cuenta con este correo."
    if (!input.document.trim()) return "El documento es obligatorio."
    if (accounts.some((account) => account.document === input.document.trim())) return "Ya existe una cuenta con este documento."
    if (!input.phone.trim()) return "El teléfono es obligatorio."
    if (input.password.length < 8) return "La contraseña debe tener al menos 8 caracteres."
    const account: CustomerAccount = {
      id: `USR-${Date.now()}`,
      name: input.name.trim(),
      document: input.document.trim(),
      email,
      phone: input.phone.trim(),
      passwordHash: hashPassword(input.password),
      createdAt: new Date().toISOString(),
    }
    const nextAccounts = [...accounts, account]
    localStorage.setItem(CUSTOMER_ACCOUNTS_KEY, JSON.stringify(nextAccounts))
    localStorage.setItem(CUSTOMER_SESSION_KEY, account.id)
    setAccounts(nextAccounts)
    setUser(account)
    return null
  }

  function logout() {
    localStorage.removeItem(CUSTOMER_SESSION_KEY)
    setUser(null)
  }

  const value = useMemo(() => ({ user, accounts, login, register, logout }), [accounts, user])
  return <CustomerSessionContext.Provider value={value}>{children}</CustomerSessionContext.Provider>
}

export function useCustomerSession() {
  const context = useContext(CustomerSessionContext)
  if (!context) throw new Error("useCustomerSession debe usarse dentro de CustomerSessionProvider")
  return context
}
