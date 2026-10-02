import nodemailer from "nodemailer"

type MailOrder = {
  id: string
  customerName: string
  email: string
  createdAt: string
  items: { reference: string; sku: string; name: string; quantity: number; unitPrice: number; total: number }[]
  subtotal: number
  tax: number
  shippingCost: number
  total: number
  paymentMethod: string
  paymentStatus: string
  shippingMethod: string
  address: string
  city: string
  department: string
  carrier: string
  trackingNumber: string
  estimatedFrom: string
  estimatedTo: string
  currentLocation: string
  status: string
}

export type OrderMailResult = { sent: boolean; message: string }

const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!)
const money = (value: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value)
const mailSettings = () => ({ user: process.env.GMAIL_USER?.trim() ?? "", password: process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "") ?? "", fromName: process.env.GMAIL_FROM_NAME?.trim() || "FERREIA" })
const transport = () => { const settings = mailSettings(); return settings.user && settings.password ? nodemailer.createTransport({ service: "gmail", auth: { user: settings.user, pass: settings.password } }) : null }

function layout(title: string, lead: string, content: string, order: MailOrder) {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "")
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#172033"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #dbe2ea"><tr><td style="background:#183153;color:#fff;padding:24px 28px"><div style="font-size:24px;font-weight:800;letter-spacing:.5px">FERREIA</div><div style="margin-top:5px;color:#d7e3f4;font-size:13px">Ferretería Digital Inteligente</div></td></tr><tr><td style="padding:28px"><div style="font-size:12px;font-weight:700;color:#a34b00;text-transform:uppercase;letter-spacing:1px">Pedido ${escapeHtml(order.id)}</div><h1 style="margin:8px 0 10px;font-size:24px;color:#183153">${escapeHtml(title)}</h1><p style="margin:0 0 22px;line-height:1.6;color:#526176">${escapeHtml(lead)}</p>${content}<div style="margin-top:24px;padding:16px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0"><strong>Consultar seguimiento</strong><p style="margin:6px 0 12px;color:#526176;font-size:13px">Usa el pedido <b>${escapeHtml(order.id)}</b> y el correo donde recibiste este mensaje.</p><a href="${escapeHtml(`${appUrl}/rastrear-pedido?pedido=${encodeURIComponent(order.id)}`)}" style="display:inline-block;background:#e89b2c;color:#172033;text-decoration:none;font-weight:700;padding:10px 16px;border-radius:8px">Rastrear pedido</a></div></td></tr><tr><td style="padding:18px 28px;background:#f8fafc;color:#64748b;font-size:12px">Este correo fue generado automáticamente por FERREIA.</td></tr></table></td></tr></table></body></html>`
}

function productsTable(order: MailOrder) {
  const rows = order.items.map((item) => `<tr><td style="padding:10px;border-bottom:1px solid #e2e8f0"><b>${escapeHtml(item.reference || item.sku)}</b><br><span style="font-size:12px;color:#64748b">SKU ${escapeHtml(item.sku)}</span></td><td style="padding:10px;border-bottom:1px solid #e2e8f0">${escapeHtml(item.name)}</td><td align="right" style="padding:10px;border-bottom:1px solid #e2e8f0">${item.quantity}</td><td align="right" style="padding:10px;border-bottom:1px solid #e2e8f0">${money(item.unitPrice)}</td><td align="right" style="padding:10px;border-bottom:1px solid #e2e8f0;font-weight:700">${money(item.total)}</td></tr>`).join("")
  return `<h2 style="font-size:16px;color:#183153;margin:22px 0 10px">Productos del pedido</h2><div style="overflow:auto"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:10px;border-collapse:collapse;font-size:13px"><thead><tr style="background:#f1f5f9"><th align="left" style="padding:10px">Referencia</th><th align="left" style="padding:10px">Artículo</th><th align="right" style="padding:10px">Cant.</th><th align="right" style="padding:10px">Precio</th><th align="right" style="padding:10px">Total</th></tr></thead><tbody>${rows}</tbody></table></div>`
}

async function send(to: string, subject: string, html: string, text: string): Promise<OrderMailResult> {
  const transporter = transport()
  const settings = mailSettings()
  if (!transporter) return { sent: false, message: "El correo no está configurado" }
  try {
    await transporter.sendMail({ from: `"${settings.fromName.replace(/["<>]/g, "")}" <${settings.user}>`, to, subject, html, text })
    return { sent: true, message: "Correo enviado correctamente" }
  } catch {
    return { sent: false, message: "El pedido se guardó, pero no fue posible enviar el correo" }
  }
}

export async function sendOrderCreatedEmail(order: MailOrder) {
  const totals = `<table role="presentation" width="100%" cellspacing="0" cellpadding="5" style="margin-top:16px;font-size:13px"><tr><td>Subtotal</td><td align="right">${money(order.subtotal)}</td></tr><tr><td>Impuestos</td><td align="right">${money(order.tax)}</td></tr><tr><td>Envío</td><td align="right">${money(order.shippingCost)}</td></tr><tr><td style="font-size:16px;font-weight:700">Total</td><td align="right" style="font-size:16px;font-weight:700">${money(order.total)}</td></tr></table>`
  const delivery = `<div style="margin-top:20px;padding:14px;border-left:4px solid #e89b2c;background:#fffbeb;font-size:13px;line-height:1.6"><b>Entrega:</b> ${escapeHtml(order.address)}, ${escapeHtml(order.city)}, ${escapeHtml(order.department)}<br><b>Método:</b> ${escapeHtml(order.shippingMethod)} · ${escapeHtml(order.estimatedFrom)} a ${escapeHtml(order.estimatedTo)}<br><b>Pago:</b> ${escapeHtml(order.paymentMethod)} · ${escapeHtml(order.paymentStatus)}</div>`
  const html = layout("Recibimos tu pedido", `Hola ${order.customerName}, tu compra fue registrada correctamente.`, productsTable(order) + totals + delivery, order)
  return send(order.email, `FERREIA | Confirmación del pedido ${order.id}`, html, `FERREIA confirmó tu pedido ${order.id}. Total: ${money(order.total)}. Estado: ${order.status}.`)
}

export async function sendOrderUpdatedEmail(order: MailOrder, detail: string) {
  const update = `<div style="padding:18px;border-radius:12px;background:#eef6ff;border:1px solid #bfdbfe;line-height:1.7"><div style="font-size:12px;color:#526176;text-transform:uppercase">Estado actual</div><div style="font-size:20px;font-weight:800;color:#183153">${escapeHtml(order.status)}</div><p style="margin:10px 0 0">${escapeHtml(detail || `Tu pedido ahora se encuentra en estado ${order.status}.`)}</p><p style="margin:10px 0 0;font-size:13px"><b>Ubicación:</b> ${escapeHtml(order.currentLocation || "Por confirmar")}<br><b>Transportadora:</b> ${escapeHtml(order.carrier || "Por asignar")}<br><b>Guía:</b> ${escapeHtml(order.trackingNumber || "Pendiente")}<br><b>Entrega estimada:</b> ${escapeHtml(order.estimatedFrom || "Por confirmar")} a ${escapeHtml(order.estimatedTo || "Por confirmar")}</p></div>`
  const html = layout("Tu pedido tiene una actualización", `Hola ${order.customerName}, FERREIA registró novedades en tu pedido.`, update + productsTable(order), order)
  return send(order.email, `FERREIA | ${order.status} · Pedido ${order.id}`, html, `Actualización del pedido ${order.id}: ${order.status}. ${detail}`)
}

export async function verifyOrderMailer() {
  const transporter = transport()
  if (!transporter) return false
  try { return await transporter.verify() } catch { return false }
}
