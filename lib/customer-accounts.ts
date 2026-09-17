/**
 * CUENTAS QUEMADAS PARA LA FASE FRONTEND
 *
 * Modifica aquí el nombre, documento, correo, teléfono y contraseña de acceso.
 * Estas cuentas siempre estarán disponibles, aunque se limpie el localStorage.
 */
export type HardcodedCustomerAccount = {
  id: string
  name: string
  document: string
  email: string
  phone: string
  password: string
  createdAt: string
}

export const HARDCODED_CUSTOMER_ACCOUNTS: HardcodedCustomerAccount[] = [
  {
    id: "USR-001",
    name: "lenin morales",
    document: "1094915404",
    email: "lenin@ejemplo.com",
    phone: "+57 310 555 0188",
    password: "Ferreia123",
    createdAt: "2026-01-15T14:00:00.000Z",
  },
]
