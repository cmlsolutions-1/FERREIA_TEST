import { MercadoPagoConfig, Payment, Preference, WebhookSignatureValidator } from "mercadopago"
import { z } from "zod"
import { orderRepository } from "@/server/modules/orders/order.repository"
import { orderService } from "@/server/modules/orders/order.service"
import { sendOrderCreatedEmail } from "@/server/modules/orders/order-mailer"
import { paymentRepository } from "@/server/modules/payments/payment.repository"
import { ApiError } from "@/server/shared/api-error"

type MercadoPagoPaymentResponse = Awaited<ReturnType<Payment["get"]>>

export const checkoutPreferenceSchema = z.object({
  orderId: z.string().trim().min(1).max(128),
  email: z.email(),
}).strict()

export const synchronizePaymentSchema = z.object({
  paymentId: z.union([z.string(), z.number()]).transform(String).pipe(z.string().regex(/^\d+$/)),
}).strict()

function accessToken() {
  const value = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim()
  if (!value) throw new ApiError(503, "MERCADOPAGO_NOT_CONFIGURED", "Mercado Pago no está configurado")
  return value
}

function applicationUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (!raw) throw new ApiError(503, "APP_URL_NOT_CONFIGURED", "Falta configurar NEXT_PUBLIC_APP_URL")
  try { return new URL(raw.endsWith("/") ? raw.slice(0, -1) : raw) } catch {
    throw new ApiError(503, "APP_URL_INVALID", "NEXT_PUBLIC_APP_URL no contiene una URL válida")
  }
}

function client() {
  return new MercadoPagoConfig({ accessToken: accessToken(), options: { timeout: 15_000, maxRetries: 2 } })
}

function environment() {
  return process.env.MERCADOPAGO_ENVIRONMENT?.trim().toLowerCase() === "production"
    ? "production" as const
    : "sandbox" as const
}

function isPublicHttps(url: URL) {
  return url.protocol === "https:" && !["localhost", "127.0.0.1", "::1"].includes(url.hostname)
}

function paymentStatus(value?: string) {
  if (["approved", "pending", "in_process", "rejected", "refunded", "cancelled"].includes(value ?? "")) return value!
  if (value === "charged_back") return "refunded"
  return "pending"
}

function dateOrNow(value?: string) {
  const parsed = value ? new Date(value) : new Date()
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function optionalDate(value?: string) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function paymentMethodLabel(value?: string) {
  if (!value) return "Mercado Pago"
  if (value.toLowerCase() === "pse") return "PSE"
  return value.charAt(0).toUpperCase() + value.slice(1).replaceAll("_", " ")
}

function sumFees(payment: MercadoPagoPaymentResponse, type: string) {
  return (payment.fee_details ?? [])
    .filter((fee) => fee.type === type)
    .reduce((sum, fee) => sum + (fee.amount ?? 0), 0)
}

async function updateOrderFromPayment(orderId: string, previousStatus: string | undefined, currentStatus: string) {
  if (previousStatus === currentStatus) return
  const order = await orderRepository.find(orderId)
  if (!order) return
  const paymentStatuses = (await paymentRepository.findByOrder(orderId)).map((payment) => payment.status)
  const effectiveStatus = paymentStatuses.includes("approved")
    ? "approved"
    : paymentStatuses.includes("refunded")
      ? "refunded"
      : paymentStatuses.some((status) => ["pending", "in_process"].includes(status))
        ? "pending"
        : currentStatus

  if (effectiveStatus === "approved" && order.paymentStatus !== "Pagado") {
    const confirmedOrder = await orderService.update(orderId, {
      paymentStatus: "Pagado",
      ...(order.status === "Pedido confirmado" ? { status: "Pago confirmado" as const } : {}),
      detail: "Mercado Pago confirmó y acreditó el pago del pedido.",
      notifyCustomer: false,
    })
    await sendOrderCreatedEmail(confirmedOrder)
  } else if (effectiveStatus === "refunded" && order.paymentStatus !== "Reembolsado") {
    await orderService.update(orderId, {
      paymentStatus: "Reembolsado",
      detail: "Mercado Pago informó el reembolso del pago.",
      notifyCustomer: true,
    })
  } else if (["rejected", "cancelled"].includes(effectiveStatus) && order.paymentStatus !== "Rechazado") {
    await orderService.update(orderId, {
      paymentStatus: "Rechazado",
      detail: currentStatus === "cancelled" ? "El pago fue cancelado en Mercado Pago." : "Mercado Pago rechazó el intento de pago. El pedido continúa pendiente de pago.",
      notifyCustomer: true,
    })
  } else if (effectiveStatus === "pending" && order.paymentStatus === "Rechazado") {
    await orderService.update(orderId, {
      paymentStatus: "Pendiente",
      detail: "Mercado Pago está procesando un nuevo intento de pago.",
      notifyCustomer: true,
    })
  }
}

async function persistPayment(payment: MercadoPagoPaymentResponse, event: string, signatureValid: boolean) {
  if (payment.id === undefined) throw new ApiError(502, "INVALID_MERCADOPAGO_PAYMENT", "Mercado Pago devolvió un pago sin identificador")
  const id = String(payment.id)
  const externalReference = payment.external_reference?.trim() ?? ""
  if (!externalReference) throw new ApiError(422, "PAYMENT_WITHOUT_ORDER", "El pago no contiene la referencia del pedido")

  const order = await orderRepository.find(externalReference)
  if (!order) throw new ApiError(422, "PAYMENT_ORDER_NOT_FOUND", "El pago no corresponde a un pedido de FERREIA")
  const amount = payment.transaction_amount ?? 0
  if (Math.abs(Number(order.total) - amount) > 0.99) {
    throw new ApiError(409, "PAYMENT_AMOUNT_MISMATCH", "El valor informado por Mercado Pago no coincide con el pedido")
  }

  const previous = await paymentRepository.find(id)
  const status = paymentStatus(payment.status)
  const marketplaceFee = sumFees(payment, "mercadopago_fee")
  const financingFee = sumFees(payment, "financing_fee")
  const taxOnFee = payment.taxes_amount ?? 0
  const refundedAmount = payment.transaction_amount_refunded ?? 0
  const netReceived = payment.transaction_details?.net_received_amount
    ?? Math.max(0, amount - marketplaceFee - financingFee - taxOnFee - refundedAmount)
  const receivedAt = new Date()
  const values = {
    orderId: order.id,
    externalReference,
    status,
    statusDetail: payment.status_detail ?? "pending",
    amount,
    refundedAmount,
    marketplaceFee,
    financingFee,
    taxOnFee,
    netReceived,
    paymentMethod: paymentMethodLabel(payment.payment_method_id),
    paymentType: payment.payment_type_id ?? "unknown",
    installments: payment.installments ?? 1,
    cardLastFour: payment.card?.last_four_digits ?? null,
    statementDescriptor: payment.statement_descriptor ?? "FERREIA",
    operationType: payment.operation_type ?? "regular_payment",
    moneyReleaseDate: optionalDate(payment.money_release_date),
    liveMode: payment.live_mode ?? false,
    customerName: order.customerName,
    customerEmail: order.email,
    customerDocument: order.document,
    webhookLastEvent: event,
    webhookReceivedAt: receivedAt,
    webhookValid: signatureValid,
    createdAt: dateOrNow(payment.date_created),
    approvedAt: optionalDate(payment.date_approved),
  }

  const saved = await paymentRepository.upsert(id, { id, ...values }, values)
  await updateOrderFromPayment(order.id, previous?.status, status)
  return saved
}

export const mercadoPagoService = {
  configuration() {
    const appUrl = applicationUrl()
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() ?? ""
    return {
      accessTokenConfigured: Boolean(token),
      publicKeyConfigured: Boolean(process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY?.trim()),
      webhookSecretConfigured: Boolean(process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim()),
      environment: environment(),
      appUrl: `${appUrl.protocol}//${appUrl.host}`,
      appUrlPublic: isPublicHttps(appUrl),
      webhookUrl: new URL("/api/payments/webhook", appUrl).toString(),
      statementDescriptor: "FERREIA",
    }
  },

  async createPreference(orderId: string, email: string) {
    const order = await orderRepository.find(orderId)
    if (!order || order.email.toLowerCase() !== email.trim().toLowerCase()) {
      throw new ApiError(404, "ORDER_NOT_FOUND", "No fue posible encontrar el pedido para iniciar el pago")
    }
    if (order.paymentMethod === "Contra entrega") throw new ApiError(409, "PAYMENT_METHOD_INVALID", "Este pedido utiliza pago contra entrega")
    if (order.paymentStatus === "Pagado") throw new ApiError(409, "ORDER_ALREADY_PAID", "Este pedido ya se encuentra pagado")

    const appUrl = applicationUrl()
    const resultUrl = new URL("/checkout/resultado", appUrl)
    const publicCallbacks = isPublicHttps(appUrl)
    const items = order.items.map((item) => ({
      id: item.sku,
      title: `${item.quantity} × ${item.name}`.slice(0, 120),
      description: `Referencia ${item.reference || item.sku}`,
      quantity: 1,
      currency_id: "COP",
      unit_price: Math.round(Number(item.total)),
    }))
    const shippingAmount = Math.round(Number(order.shippingCost))
    const productAmount = items.reduce((sum, item) => sum + item.unit_price, 0)
    const taxesAndRounding = Math.round(Number(order.total)) - productAmount - shippingAmount
    if (taxesAndRounding > 0) items.push({ id: "IVA", title: "Impuestos", description: `Impuestos del pedido ${order.id}`, quantity: 1, currency_id: "COP", unit_price: taxesAndRounding })
    if (shippingAmount > 0) items.push({ id: "ENVIO", title: "Envío", description: `${order.shippingMethod} a ${order.city}`, quantity: 1, currency_id: "COP", unit_price: shippingAmount })

    try {
      const preference = await new Preference(client()).create({
        body: {
          items,
          external_reference: order.id,
          statement_descriptor: "FERREIA",
          additional_info: `Pedido ${order.id} de FERREIA`,
          metadata: { order_id: order.id },
          // En producción podemos precargar los datos reales del comprador. En
          // sandbox Mercado Pago exige que el pagador sea una cuenta de prueba
          // distinta del vendedor; enviar aquí el correo real del pedido mezcla
          // identidades reales/de prueba y el checkout rechaza la operación.
          ...(environment() === "production" ? {
            payer: { email: order.email, name: order.customerName },
          } : {}),
          ...(publicCallbacks ? {
            back_urls: {
              success: `${resultUrl}?result=success`,
              pending: `${resultUrl}?result=pending`,
              failure: `${resultUrl}?result=failure`,
            },
            auto_return: "approved",
            notification_url: new URL("/api/payments/webhook?source_news=webhooks", appUrl).toString(),
          } : {}),
        },
        requestOptions: { idempotencyKey: `ferreia-preference-${order.id}` },
      })
      const checkoutUrl = environment() === "sandbox"
        ? preference.sandbox_init_point ?? preference.init_point
        : preference.init_point
      if (!preference.id || !checkoutUrl) throw new Error("Preference response is missing id or checkout URL")
      return { preferenceId: preference.id, checkoutUrl, orderId: order.id, environment: environment() }
    } catch (error) {
      const failure = error as Error & { status?: number; cause?: unknown }
      console.error(`Mercado Pago preference failed ${JSON.stringify({ name: failure.name, message: failure.message, status: failure.status, cause: failure.cause })}`)
      throw new ApiError(502, "MERCADOPAGO_PREFERENCE_FAILED", "No fue posible iniciar el pago con Mercado Pago")
    }
  },

  async synchronize(paymentId: string, event = "payment.return", signatureValid = false) {
    try {
      const payment = await new Payment(client()).get({ id: paymentId })
      return await persistPayment(payment, event, signatureValid)
    } catch (error) {
      if (error instanceof ApiError) throw error
      console.error("Mercado Pago payment synchronization failed", error instanceof Error ? { name: error.name, message: error.message } : { type: typeof error })
      throw new ApiError(502, "MERCADOPAGO_SYNC_FAILED", "No fue posible confirmar el estado del pago con Mercado Pago")
    }
  },

  async reconcileRecent() {
    try {
      const response = await new Payment(client()).search({
        options: { sort: "date_last_updated", criteria: "desc", limit: 50, offset: 0 },
      })
      let processed = 0
      for (const candidate of response.results ?? []) {
        if (!candidate.id || !candidate.external_reference?.startsWith("FE-")) continue
        try {
          await this.synchronize(String(candidate.id), "payment.reconciled", false)
          processed += 1
        } catch (error) {
          if (!(error instanceof ApiError) || error.code !== "PAYMENT_ORDER_NOT_FOUND") throw error
        }
      }
      return { processed }
    } catch (error) {
      if (error instanceof ApiError) throw error
      console.error("Mercado Pago reconciliation failed", error instanceof Error ? { name: error.name, message: error.message } : { type: typeof error })
      throw new ApiError(502, "MERCADOPAGO_RECONCILIATION_FAILED", "No fue posible sincronizar los pagos recientes de Mercado Pago")
    }
  },

  validateWebhook(request: Request, dataId: string) {
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim()
    if (!secret) return false
    try {
      WebhookSignatureValidator.validate({
        xSignature: request.headers.get("x-signature"),
        xRequestId: request.headers.get("x-request-id"),
        dataId,
        secret,
      })
      return true
    } catch {
      throw new ApiError(401, "INVALID_WEBHOOK_SIGNATURE", "La firma de la notificación no es válida")
    }
  },
}
