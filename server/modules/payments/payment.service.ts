import type { Prisma } from "@prisma/client"
import type { z } from "zod"
import { paymentRepository } from "@/server/modules/payments/payment.repository"
import { paymentFiltersSchema } from "@/server/modules/payments/payment.schema"
import { ApiError } from "@/server/shared/api-error"
import { paginationMeta } from "@/server/shared/pagination"
type Record = NonNullable<Awaited<ReturnType<typeof paymentRepository.find>>>
function dto(item: Record) { return { id: item.id, orderId: item.orderId ?? "", externalReference: item.externalReference, createdAt: item.createdAt.toISOString(), approvedAt: item.approvedAt?.toISOString(), customer: { name: item.customerName, email: item.customerEmail, document: item.customerDocument }, status: item.status, statusDetail: item.statusDetail, amount: item.amount.toNumber(), refundedAmount: item.refundedAmount.toNumber(), marketplaceFee: item.marketplaceFee.toNumber(), financingFee: item.financingFee.toNumber(), taxOnFee: item.taxOnFee.toNumber(), netReceived: item.netReceived.toNumber(), paymentMethod: item.paymentMethod, paymentType: item.paymentType, installments: item.installments, cardLastFour: item.cardLastFour ?? undefined, statementDescriptor: item.statementDescriptor, operationType: item.operationType, moneyReleaseDate: item.moneyReleaseDate?.toISOString(), liveMode: item.liveMode, webhook: { lastEvent: item.webhookLastEvent, receivedAt: item.webhookReceivedAt.toISOString(), signatureValid: item.webhookValid } } }
export const paymentService = {
  async list(filters: z.infer<typeof paymentFiltersSchema>) { const where: Prisma.PaymentWhereInput = { ...(filters.status ? { status: filters.status } : {}), ...(filters.search ? { OR: [{ id: { contains: filters.search, mode: "insensitive" } }, { orderId: { contains: filters.search, mode: "insensitive" } }, { customerEmail: { contains: filters.search, mode: "insensitive" } }] } : {}) }; const [items, total] = await Promise.all([paymentRepository.list(where, (filters.page - 1) * filters.limit, filters.limit), paymentRepository.count(where)]); return { data: items.map(dto), meta: paginationMeta(filters.page, filters.limit, total) } },
  async get(id: string) { const item = await paymentRepository.find(id); if (!item) throw new ApiError(404, "PAYMENT_NOT_FOUND", "No fue posible encontrar el pago"); return dto(item) },
}
