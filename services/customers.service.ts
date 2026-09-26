import { apiRequest } from "@/services/api-client"
export type CustomerAccount = { id: string; name: string; document: string; email: string; phone: string; createdAt?: string }
export async function getCustomerSession() { return apiRequest<CustomerAccount>("/api/auth/customer") }
export async function loginCustomer(email: string, password: string) { return apiRequest<CustomerAccount>("/api/auth/customer", { method: "POST", body: JSON.stringify({ email, password }) }) }
export async function registerCustomer(input: { name: string; document: string; email: string; phone: string; password: string }) { return apiRequest<CustomerAccount>("/api/auth/customer", { method: "PUT", body: JSON.stringify(input) }) }
export async function logoutCustomer() { return apiRequest<null>("/api/auth/customer", { method: "DELETE" }) }
export type CustomerDirectoryRecord = { id: string; name: string; type: "Persona" | "Empresa"; document: string; email: string; phone: string; city: string; origin: "Cuenta web" | "CRM"; purchases: number; total: number; lastPurchase: string; segment: "VIP" | "Frecuente" | "Nuevo"; createdAt: string }
export type CreateCrmCustomerInput = { name: string; type: "Persona" | "Empresa"; document: string; email: string; phone: string; city: string }
export async function getCustomerDirectory() { return apiRequest<CustomerDirectoryRecord[]>("/api/customers") }
export async function createCrmCustomer(input: CreateCrmCustomerInput) { return apiRequest<CustomerDirectoryRecord>("/api/customers", { method: "POST", body: JSON.stringify(input) }) }
