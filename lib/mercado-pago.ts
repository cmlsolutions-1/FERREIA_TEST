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
  paymentType: string
  installments: number
  cardLastFour?: string
  statementDescriptor: string
  operationType: string
  moneyReleaseDate?: string
  liveMode: boolean
  webhook: { lastEvent: string; receivedAt: string; signatureValid: boolean }
}

export type MercadoPagoConfiguration = {
  accessTokenConfigured: boolean
  publicKeyConfigured: boolean
  webhookSecretConfigured: boolean
  environment: "sandbox" | "production"
  appUrl: string
  appUrlPublic: boolean
  webhookUrl: string
  statementDescriptor: string
}

export type MercadoPagoCheckout = {
  preferenceId: string
  checkoutUrl: string
  orderId: string
  environment: "sandbox" | "production"
}

export type MercadoPagoSyncResult = {
  id: string
  orderId: string
  status: MercadoPagoStatus
  statusDetail: string
}

export const statusLabels: Record<MercadoPagoStatus, string> = {
  approved: "Aprobado",
  pending: "Pendiente",
  in_process: "En revisión",
  rejected: "Rechazado",
  refunded: "Reembolsado",
  cancelled: "Cancelado",
}

export const detailLabels: Record<string, string> = {
  accredited: "Dinero acreditado",
  partially_refunded: "Reembolso parcial",
  pending_waiting_transfer: "Esperando transferencia bancaria",
  pending_review_manual: "Revisión manual de Mercado Pago",
  cc_rejected_insufficient_amount: "Fondos insuficientes",
  cc_rejected_bad_filled_card_number: "Número de tarjeta incorrecto",
  cc_rejected_bad_filled_date: "Fecha de vencimiento incorrecta",
  cc_rejected_bad_filled_security_code: "Código de seguridad incorrecto",
  cc_rejected_call_for_authorize: "El banco requiere autorización",
  cc_rejected_card_disabled: "Tarjeta deshabilitada",
  cc_rejected_high_risk: "Pago rechazado por seguridad",
  refunded: "Reembolso total realizado",
  expired: "Pago vencido",
}
