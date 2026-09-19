export const MERCADO_PAGO_STORAGE_KEY = "ferreia-mercado-pago-payments-v1"
export const MERCADO_PAGO_SETTINGS_KEY = "ferreia-mercado-pago-settings-v1"

export type MercadoPagoStatus = "approved" | "pending" | "in_process" | "rejected" | "refunded" | "cancelled"

export type MercadoPagoPayment = {
  id: string
  orderId: string
  externalReference: string
  createdAt: string
  approvedAt?: string
  customer: { name: string; email: string; document: string }
  status: MercadoPagoStatus
  statusDetail: string
  amount: number
  refundedAmount: number
  marketplaceFee: number
  financingFee: number
  taxOnFee: number
  netReceived: number
  paymentMethod: string
  paymentType: "credit_card" | "debit_card" | "bank_transfer" | "account_money"
  installments: number
  cardLastFour?: string
  statementDescriptor: string
  operationType: "regular_payment"
  moneyReleaseDate?: string
  liveMode: boolean
  webhook: { lastEvent: string; receivedAt: string; signatureValid: boolean }
}

export type MercadoPagoSettings = {
  accountName: string
  applicationId: string
  publicKey: string
  environment: "sandbox" | "production"
  webhookUrl: string
  webhookSecretConfigured: boolean
  accessTokenConfigured: boolean
  statementDescriptor: string
}

export const initialMercadoPagoSettings: MercadoPagoSettings = {
  accountName: "FERREIA Colombia",
  applicationId: "APP-MOCK-984251",
  publicKey: "TEST-mock-public-key-ferreia",
  environment: "sandbox",
  webhookUrl: "https://api.ferreia.co/webhooks/mercado-pago",
  webhookSecretConfigured: true,
  accessTokenConfigured: true,
  statementDescriptor: "FERREIA",
}

function payment(input: Omit<MercadoPagoPayment, "externalReference" | "statementDescriptor" | "operationType" | "liveMode">): MercadoPagoPayment {
  return { ...input, externalReference: input.orderId, statementDescriptor: "FERREIA", operationType: "regular_payment", liveMode: false }
}

export const initialMercadoPagoPayments: MercadoPagoPayment[] = [
  payment({ id: "MP-1049287612", orderId: "FE-10235", createdAt: "2026-09-18T14:18:00-05:00", approvedAt: "2026-09-18T14:18:14-05:00", customer: { name: "Carlos Mendoza", email: "carlos@ejemplo.com", document: "1032456789" }, status: "approved", statusDetail: "accredited", amount: 547281, refundedAmount: 0, marketplaceFee: 18942, financingFee: 0, taxOnFee: 3599, netReceived: 524740, paymentMethod: "PSE", paymentType: "bank_transfer", installments: 1, moneyReleaseDate: "2026-09-18", webhook: { lastEvent: "payment.updated", receivedAt: "2026-09-18T14:18:18-05:00", signatureValid: true } }),
  payment({ id: "MP-1049287441", orderId: "FE-10234", createdAt: "2026-09-17T10:42:00-05:00", approvedAt: "2026-09-17T10:42:08-05:00", customer: { name: "Andrea Gómez", email: "andrea@ejemplo.com", document: "52234567" }, status: "approved", statusDetail: "partially_refunded", amount: 187782, refundedAmount: 35000, marketplaceFee: 6497, financingFee: 0, taxOnFee: 1234, netReceived: 145051, paymentMethod: "Visa", paymentType: "credit_card", installments: 3, cardLastFour: "4821", moneyReleaseDate: "2026-09-30", webhook: { lastEvent: "payment.updated", receivedAt: "2026-09-18T09:05:21-05:00", signatureValid: true } }),
  payment({ id: "MP-1049287018", orderId: "FE-10233", createdAt: "2026-09-16T16:20:00-05:00", approvedAt: "2026-09-16T16:20:05-05:00", customer: { name: "Ferretería El Tornillo", email: "pedidos@eltornillo.co", document: "900345671-2" }, status: "approved", statusDetail: "accredited", amount: 749700, refundedAmount: 0, marketplaceFee: 25940, financingFee: 0, taxOnFee: 4929, netReceived: 718831, paymentMethod: "Mastercard", paymentType: "credit_card", installments: 1, cardLastFour: "9134", moneyReleaseDate: "2026-09-30", webhook: { lastEvent: "payment.updated", receivedAt: "2026-09-16T16:20:09-05:00", signatureValid: true } }),
  payment({ id: "MP-1049286882", orderId: "FE-10232", createdAt: "2026-09-16T09:12:00-05:00", customer: { name: "Laura Martínez", email: "laura@ejemplo.com", document: "1018456721" }, status: "pending", statusDetail: "pending_waiting_transfer", amount: 93991, refundedAmount: 0, marketplaceFee: 0, financingFee: 0, taxOnFee: 0, netReceived: 0, paymentMethod: "PSE", paymentType: "bank_transfer", installments: 1, webhook: { lastEvent: "payment.created", receivedAt: "2026-09-16T09:12:03-05:00", signatureValid: true } }),
  payment({ id: "MP-1049286205", orderId: "FE-10231", createdAt: "2026-09-15T18:31:00-05:00", customer: { name: "Construcciones Delta", email: "compras@delta.co", document: "901456789-0" }, status: "in_process", statusDetail: "pending_review_manual", amount: 462791, refundedAmount: 0, marketplaceFee: 0, financingFee: 0, taxOnFee: 0, netReceived: 0, paymentMethod: "Visa", paymentType: "credit_card", installments: 6, cardLastFour: "1179", webhook: { lastEvent: "payment.updated", receivedAt: "2026-09-15T18:31:12-05:00", signatureValid: true } }),
  payment({ id: "MP-1049285994", orderId: "FE-10230", createdAt: "2026-09-15T12:07:00-05:00", customer: { name: "Diego Ramírez", email: "diego@ejemplo.com", document: "79845612" }, status: "rejected", statusDetail: "cc_rejected_insufficient_amount", amount: 294900, refundedAmount: 0, marketplaceFee: 0, financingFee: 0, taxOnFee: 0, netReceived: 0, paymentMethod: "Mastercard", paymentType: "credit_card", installments: 1, cardLastFour: "7205", webhook: { lastEvent: "payment.updated", receivedAt: "2026-09-15T12:07:07-05:00", signatureValid: true } }),
  payment({ id: "MP-1049285180", orderId: "FE-10229", createdAt: "2026-09-14T15:44:00-05:00", approvedAt: "2026-09-14T15:44:06-05:00", customer: { name: "María Torres", email: "maria@ejemplo.com", document: "52890123" }, status: "refunded", statusDetail: "refunded", amount: 128900, refundedAmount: 128900, marketplaceFee: 0, financingFee: 0, taxOnFee: 0, netReceived: 0, paymentMethod: "Dinero en cuenta", paymentType: "account_money", installments: 1, moneyReleaseDate: "2026-09-14", webhook: { lastEvent: "payment.updated", receivedAt: "2026-09-18T11:22:40-05:00", signatureValid: true } }),
]

export const statusLabels: Record<MercadoPagoStatus, string> = { approved: "Aprobado", pending: "Pendiente", in_process: "En revisión", rejected: "Rechazado", refunded: "Reembolsado", cancelled: "Cancelado" }

export const detailLabels: Record<string, string> = {
  accredited: "Dinero acreditado",
  partially_refunded: "Reembolso parcial",
  pending_waiting_transfer: "Esperando transferencia bancaria",
  pending_review_manual: "Revisión manual de Mercado Pago",
  cc_rejected_insufficient_amount: "Fondos insuficientes",
  refunded: "Reembolso total realizado",
  expired: "Pago vencido",
}
