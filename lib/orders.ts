import { PRODUCTS } from "@/lib/data"
import { calculateTieredPrice } from "@/lib/pricing"

export const ORDER_STORAGE_KEY = "ferreia-orders-v1"
export const INVENTORY_UPDATED_EVENT = "ferreia:inventory-updated"

export const ORDER_STATUSES = [
  "Pedido confirmado",
  "Pago confirmado",
  "En preparación",
  "Listo para envío",
  "Enviado",
  "En centro de distribución",
  "En tránsito",
  "En reparto",
  "Entregado",
  "Cancelado",
] as const

export const CARRIERS = [
  "Por asignar",
  "Servientrega",
  "Coordinadora",
  "TCC",
  "Interrapidísimo",
  "Mensajero local",
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]
export type PaymentStatus = "Pendiente" | "Pagado" | "Contra entrega" | "Reembolsado"
export type ShippingMethod = "Estándar" | "Express"

export type OrderItem = {
  productId: string
  sku: string
  name: string
  image: string
  quantity: number
  unitPrice: number
  total: number
}

export type OrderTimelineEvent = {
  id: string
  status: OrderStatus
  title: string
  detail: string
  location: string
  occurredAt: string
}

export type FerreiaOrder = {
  id: string
  customerId: string | null
  guest: boolean
  customerName: string
  document: string
  email: string
  phone: string
  createdAt: string
  items: OrderItem[]
  subtotal: number
  tax: number
  shippingCost: number
  total: number
  paymentMethod: string
  paymentStatus: PaymentStatus
  shippingMethod: ShippingMethod
  address: string
  city: string
  department: string
  carrier: string
  trackingNumber: string
  estimatedFrom: string
  estimatedTo: string
  currentLocation: string
  status: OrderStatus
  timeline: OrderTimelineEvent[]
  inventoryApplied: boolean
  inventoryRestored: boolean
}

export type CreateOrderInput = Omit<
  FerreiaOrder,
  | "id"
  | "createdAt"
  | "carrier"
  | "trackingNumber"
  | "estimatedFrom"
  | "estimatedTo"
  | "currentLocation"
  | "status"
  | "timeline"
  | "inventoryApplied"
  | "inventoryRestored"
>

function dateAt(day: number, hour: number) {
  return new Date(2026, 8, day, hour, 0, 0).toISOString()
}

function event(id: string, status: OrderStatus, title: string, detail: string, location: string, occurredAt: string): OrderTimelineEvent {
  return { id, status, title, detail, location, occurredAt }
}

function seedItem(productIndex: number, quantity: number): OrderItem {
  const product = PRODUCTS[productIndex]
  const pricing = calculateTieredPrice(product, quantity)
  return {
    productId: product.id,
    sku: product.sku,
    name: product.name,
    image: product.image,
    quantity,
    unitPrice: pricing.averageUnitPrice,
    total: pricing.total,
  }
}

function seedOrder(config: {
  id: string
  customerId: string | null
  guest: boolean
  customerName: string
  document: string
  email: string
  phone: string
  createdAt: string
  item: OrderItem
  address: string
  city: string
  department: string
  carrier: string
  trackingNumber: string
  estimatedFrom: string
  estimatedTo: string
  currentLocation: string
  status: OrderStatus
  events: OrderTimelineEvent[]
}): FerreiaOrder {
  const subtotal = config.item.total
  const tax = Math.round(subtotal * 0.19)
  return {
    ...config,
    items: [config.item],
    subtotal,
    tax,
    shippingCost: 0,
    total: subtotal + tax,
    paymentMethod: "PSE",
    paymentStatus: "Pagado",
    shippingMethod: "Estándar",
    timeline: config.events,
    inventoryApplied: false,
    inventoryRestored: false,
  }
}

export const INITIAL_ORDERS: FerreiaOrder[] = [
  seedOrder({
    id: "FE-10235",
    customerId: null,
    guest: true,
    customerName: "Carlos Mendoza",
    document: "1032456789",
    email: "carlos@ejemplo.com",
    phone: "+57 300 555 0142",
    createdAt: dateAt(14, 9),
    item: seedItem(1, 1),
    address: "Cra. 43 # 18-22",
    city: "Medellín",
    department: "Antioquia",
    carrier: "Por asignar",
    trackingNumber: "",
    estimatedFrom: "2026-09-18",
    estimatedTo: "2026-09-20",
    currentLocation: "Pedido recibido en FERREIA",
    status: "Pedido confirmado",
    events: [event("EV-10235-1", "Pedido confirmado", "Pedido recibido", "Estamos validando los datos de la compra.", "FERREIA · Bogotá", dateAt(14, 9))],
  }),
  seedOrder({
    id: "FE-10234",
    customerId: "USR-001",
    guest: false,
    customerName: "Andrea Gómez",
    document: "52234567",
    email: "andrea@ejemplo.com",
    phone: "+57 310 555 0188",
    createdAt: dateAt(12, 11),
    item: seedItem(6, 2),
    address: "Calle 93 # 15-40",
    city: "Bogotá",
    department: "Bogotá D.C.",
    carrier: "Servientrega",
    trackingNumber: "SER-80451290",
    estimatedFrom: "2026-09-15",
    estimatedTo: "2026-09-16",
    currentLocation: "Centro logístico Bogotá",
    status: "En preparación",
    events: [
      event("EV-10234-1", "Pedido confirmado", "Pedido recibido", "La compra fue registrada correctamente.", "FERREIA · Bogotá", dateAt(12, 11)),
      event("EV-10234-2", "Pago confirmado", "Pago confirmado", "El pago fue aprobado.", "FERREIA · Bogotá", dateAt(12, 11)),
      event("EV-10234-3", "En preparación", "Preparando tu pedido", "Estamos alistando y verificando los productos.", "Centro logístico Bogotá", dateAt(13, 8)),
    ],
  }),
  seedOrder({
    id: "FE-10233",
    customerId: null,
    guest: true,
    customerName: "Ferretería El Tornillo",
    document: "900345671-2",
    email: "pedidos@eltornillo.co",
    phone: "+57 315 555 0101",
    createdAt: dateAt(9, 10),
    item: seedItem(3, 30),
    address: "Av. 6N # 25-18",
    city: "Cali",
    department: "Valle del Cauca",
    carrier: "TCC",
    trackingNumber: "TCC-889201",
    estimatedFrom: "2026-09-14",
    estimatedTo: "2026-09-15",
    currentLocation: "Centro de distribución Cali",
    status: "En tránsito",
    events: [
      event("EV-10233-1", "Pedido confirmado", "Pedido recibido", "La compra fue registrada correctamente.", "FERREIA · Bogotá", dateAt(9, 10)),
      event("EV-10233-2", "Pago confirmado", "Pago confirmado", "El pago fue aprobado.", "FERREIA · Bogotá", dateAt(9, 10)),
      event("EV-10233-3", "Enviado", "Pedido despachado", "TCC recogió el paquete.", "Bogotá D.C.", dateAt(11, 15)),
      event("EV-10233-4", "En tránsito", "En camino a tu ciudad", "El envío llegó al centro de distribución regional.", "Centro de distribución Cali", dateAt(13, 7)),
    ],
  }),
  seedOrder({
    id: "FE-10232",
    customerId: "USR-001",
    guest: false,
    customerName: "Andrea Gómez",
    document: "52234567",
    email: "andrea@ejemplo.com",
    phone: "+57 310 555 0188",
    createdAt: dateAt(3, 9),
    item: seedItem(9, 2),
    address: "Calle 93 # 15-40",
    city: "Bogotá",
    department: "Bogotá D.C.",
    carrier: "Coordinadora",
    trackingNumber: "COO-445566",
    estimatedFrom: "2026-09-07",
    estimatedTo: "2026-09-08",
    currentLocation: "Entregado en la dirección indicada",
    status: "Entregado",
    events: [
      event("EV-10232-1", "Pedido confirmado", "Pedido recibido", "La compra fue registrada correctamente.", "FERREIA · Bogotá", dateAt(3, 9)),
      event("EV-10232-2", "Pago confirmado", "Pago confirmado", "El pago fue aprobado.", "FERREIA · Bogotá", dateAt(3, 9)),
      event("EV-10232-3", "Enviado", "Pedido despachado", "Coordinadora recogió el paquete.", "Bogotá D.C.", dateAt(5, 14)),
      event("EV-10232-4", "En reparto", "En reparto", "El mensajero inició la ruta de entrega.", "Bogotá D.C.", dateAt(7, 8)),
      event("EV-10232-5", "Entregado", "Pedido entregado", "La mercancía fue recibida en la dirección indicada.", "Bogotá D.C.", dateAt(7, 15)),
    ],
  }),
]

export function orderProgress(status: OrderStatus) {
  if (status === "Cancelado") return 0
  const visibleStatuses = ORDER_STATUSES.filter((item) => item !== "Cancelado")
  const index = visibleStatuses.indexOf(status)
  return Math.round(((index + 1) / visibleStatuses.length) * 100)
}

export function orderStatusLabel(status: OrderStatus) {
  return status
}
