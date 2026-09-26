import { prisma } from "@/server/database/prisma"
export const customerRepository = {
  create(data: { id: string; name: string; document: string; email: string; phone: string; passwordHash: string }) { return prisma.customer.create({ data: { ...data, role: "CUSTOMER" } }) },
  list() { return prisma.customer.findMany({ where: { role: "CUSTOMER" }, select: { id: true, name: true, document: true, email: true, phone: true, createdAt: true }, orderBy: { createdAt: "desc" } }) },
  listCrm() { return prisma.crmCustomer.findMany({ orderBy: { createdAt: "desc" } }) },
  createCrm(data: { name: string; type: string; document: string | null; email: string | null; phone: string; city: string }) { return prisma.crmCustomer.create({ data }) },
  findExisting(document: string, email: string) { return Promise.all([
    prisma.customer.findFirst({ where: { OR: [document ? { document } : undefined, email ? { email } : undefined].filter((item): item is { document: string } | { email: string } => Boolean(item)) }, select: { id: true } }),
    prisma.crmCustomer.findFirst({ where: { OR: [document ? { document } : undefined, email ? { email } : undefined].filter((item): item is { document: string } | { email: string } => Boolean(item)) }, select: { id: true } }),
  ]) },
  listOrders() { return prisma.order.findMany({ where: { status: { not: "Cancelado" } }, select: { customerId: true, document: true, email: true, city: true, total: true, createdAt: true } }) },
}
