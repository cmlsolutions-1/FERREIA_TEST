import { customerRepository } from "@/server/modules/customers/customer.repository"
import type { z } from "zod"
import { createCrmCustomerSchema } from "@/server/modules/customers/customer.schema"
import { ApiError } from "@/server/shared/api-error"

function normalize(value: string | null | undefined) { return value?.trim().toLowerCase() ?? "" }

export const customersService = {
  async list() {
    const [accounts, crm, orders] = await Promise.all([customerRepository.list(), customerRepository.listCrm(), customerRepository.listOrders()])
    const linkedCrm = (account: (typeof accounts)[number]) => crm.find((item) =>
      (item.email && normalize(item.email) === normalize(account.email)) ||
      (item.document && normalize(item.document) === normalize(account.document)),
    )
    const summaries = [
      ...accounts.map((item) => {
        const profile = linkedCrm(item)
        return { id: item.id, name: item.name, type: (profile?.type ?? "Persona") as "Persona" | "Empresa", document: item.document, email: item.email, phone: item.phone, city: profile?.city ?? "", origin: "Cuenta web" as const, createdAt: item.createdAt.toISOString(), accountId: item.id }
      }),
      ...crm.filter((item) => !accounts.some((account) => linkedCrm(account)?.id === item.id)).map((item) => ({ id: item.id, name: item.name, type: item.type as "Persona" | "Empresa", document: item.document ?? "", email: item.email ?? "", phone: item.phone, city: item.city, origin: "CRM" as const, createdAt: item.createdAt.toISOString(), accountId: null })),
    ]
    return summaries.map((customer) => {
      const matches = orders.filter((order) =>
        (customer.accountId && order.customerId === customer.accountId) ||
        (customer.email && normalize(order.email) === normalize(customer.email)) ||
        (customer.document && normalize(order.document) === normalize(customer.document)),
      )
      const latest = matches.reduce<(typeof matches)[number] | null>((recent, order) => !recent || order.createdAt > recent.createdAt ? order : recent, null)
      const purchases = matches.length
      return {
        id: customer.id, name: customer.name, type: customer.type, document: customer.document, email: customer.email,
        phone: customer.phone, city: customer.city || latest?.city || "Sin ciudad registrada", origin: customer.origin,
        purchases, total: matches.reduce((sum, order) => sum + order.total.toNumber(), 0),
        lastPurchase: latest?.createdAt.toISOString() ?? "", segment: purchases >= 10 ? "VIP" : purchases >= 3 ? "Frecuente" : "Nuevo",
        createdAt: customer.createdAt,
      }
    })
  },
  async create(input: z.infer<typeof createCrmCustomerSchema>) {
    const email = normalize(input.email)
    const document = input.document.trim()
    const existing = await customerRepository.findExisting(document, email)
    if (existing.some(Boolean)) throw new ApiError(409, "DUPLICATE_RECORD", "Ya existe un cliente con este documento o correo")
    return customerRepository.createCrm({ name: input.name, type: input.type, document: document || null, email: email || null, phone: input.phone, city: input.city })
  },
}
