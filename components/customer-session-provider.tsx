"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { HARDCODED_CUSTOMER_ACCOUNTS } from "@/lib/customer-accounts"

export const CUSTOMER_ACCOUNTS_KEY = "ferreia-customer-accounts-v2"
export const CUSTOMER_SESSION_KEY = "ferreia-customer-session-v2"

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

const CustomerSessionContext = createContext<CustomerSessionContextValue | null>(null)

function hashPassword(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

function hardcodedAccounts(): CustomerAccount[] {
  return HARDCODED_CUSTOMER_ACCOUNTS.map(({ password, ...account }) => ({
    ...account,
    email: account.email.trim().toLowerCase(),
    passwordHash: hashPassword(password),
  }))
}

function readRegisteredAccounts() {
  try {
    const stored = localStorage.getItem(CUSTOMER_ACCOUNTS_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed as CustomerAccount[] : []
  } catch {
    return []
  }
}

function readAccounts() {
  const fixed = hardcodedAccounts()
  const fixedIds = new Set(fixed.map((account) => account.id))
  const fixedEmails = new Set(fixed.map((account) => account.email))
  const registered = readRegisteredAccounts().filter((account) =>
    account?.id
      && account?.email
      && account?.passwordHash
      && !fixedIds.has(account.id)
      && !fixedEmails.has(account.email.toLowerCase()),
  )
  return [...fixed, ...registered]
}

export function CustomerSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerAccount | null>(null)
  const [accounts, setAccounts] = useState<CustomerAccount[]>(() => hardcodedAccounts())

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
    try {
      localStorage.setItem(CUSTOMER_SESSION_KEY, account.id)
    } catch {
      return "El navegador no permitió guardar la sesión."
    }
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
    try {
      localStorage.setItem(CUSTOMER_ACCOUNTS_KEY, JSON.stringify([...readRegisteredAccounts(), account]))
      localStorage.setItem(CUSTOMER_SESSION_KEY, account.id)
    } catch {
      return "No fue posible guardar la cuenta. Revisa que localStorage esté habilitado en el navegador."
    }
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
