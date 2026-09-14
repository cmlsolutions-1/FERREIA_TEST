// ============================================================================
// FERREIA — Datos quemados (mock). Reemplazar por API/DB en el futuro.
// ============================================================================

export const COMPANY = {
  name: "FERREIA",
  tagline: "Ferretería Digital Inteligente",
  phone: "+57 601 555 0199",
  email: "ventas@ferreia.co",
  address: "Cra. 50 #80-120, Bogotá D.C., Colombia",
}

export type Category = {
  slug: string
  name: string
  icon: string
  count: number
}

export const CATEGORIES: Category[] = [
  { slug: "herramientas-manuales", name: "Herramientas Manuales", icon: "Wrench", count: 248 },
  { slug: "herramientas-electricas", name: "Herramientas Eléctricas", icon: "Drill", count: 186 },
  { slug: "iluminacion", name: "Iluminación", icon: "Lightbulb", count: 142 },
  { slug: "carpinteria", name: "Carpintería", icon: "Hammer", count: 97 },
  { slug: "tornilleria", name: "Tornillería", icon: "Bolt", count: 312 },
  { slug: "cerrajeria", name: "Cerrajería", icon: "KeyRound", count: 88 },
  { slug: "seguridad-industrial", name: "Seguridad Industrial", icon: "HardHat", count: 134 },
  { slug: "pinturas-acabados", name: "Pinturas y Acabados", icon: "PaintRoller", count: 121 },
]

export const BRANDS = [
  "Bosch",
  "DeWalt",
  "Stanley",
  "Truper",
  "Makita",
  "Pretul",
  "Philips",
  "3M",
]

export type Product = {
  id: string
  name: string
  brand: string
  category: string
  subcategory: string
  price: number
  oldPrice?: number
  rating: number
  reviews: number
  stock: number
  sku: string
  barcode: string
  power?: string
  size?: string
  material?: string
  image: string
  priceTiers: ProductPriceTiers
  badge?: "Más vendido" | "Oferta" | "Nuevo"
  description: string
  specs: { label: string; value: string }[]
  compatibilities: string[]
}

export type ProductPriceTiers = {
  unit: {
    label: "Unidad"
    quantity: 1
    unitPrice: number
  }
  inner: {
    label: "Caja inner"
    quantity: number
    unitPrice: number
  }
  master: {
    label: "Caja master"
    quantity: number
    unitPrice: number
  }
}

function productImage(filename: string) {
  return `/images/products/${filename}`
}

function priceTiers(unitPrice: number, innerQuantity = 10, masterQuantity = 30): ProductPriceTiers {
  return {
    unit: { label: "Unidad", quantity: 1, unitPrice },
    inner: { label: "Caja inner", quantity: innerQuantity, unitPrice: Math.round(unitPrice * 0.9) },
    master: { label: "Caja master", quantity: masterQuantity, unitPrice: Math.round(unitPrice * 0.85) },
  }
}

export const PRODUCTS: Product[] = [
  {
    id: "p-001",
    name: "Bombillo LED E27 12W Luz Cálida",
    brand: "Philips",
    category: "iluminacion",
    subcategory: "Bombillos LED",
    price: 12900,
    oldPrice: 18900,
    rating: 4.8,
    reviews: 214,
    stock: 320,
    sku: "ILU-LED-E27-12W",
    barcode: "7701234560011",
    power: "12W",
    size: "E27",
    material: "Policarbonato",
    image: productImage("p-001-bombillo-led-e27-12w-luz-calida.svg"),
    priceTiers: priceTiers(12900, 12, 60),
    badge: "Más vendido",
    description:
      "Bombillo LED de alta eficiencia con casquillo E27, luz cálida de 3000K, ideal para sala, comedor y habitaciones. Equivale a 100W incandescentes con un ahorro de hasta 88% en energía.",
    specs: [
      { label: "Potencia", value: "12W" },
      { label: "Casquillo", value: "E27" },
      { label: "Temperatura", value: "3000K cálida" },
      { label: "Lúmenes", value: "1055 lm" },
      { label: "Vida útil", value: "15.000 horas" },
      { label: "Voltaje", value: "100-240V" },
    ],
    compatibilities: ["Sockets E27 estándar", "Dimmers compatibles LED", "Plafones de techo"],
  },
  {
    id: "p-002",
    name: "Taladro Percutor Inalámbrico 20V",
    brand: "DeWalt",
    category: "herramientas-electricas",
    subcategory: "Taladros",
    price: 459900,
    oldPrice: 529900,
    rating: 4.9,
    reviews: 512,
    stock: 42,
    sku: "ELE-TAL-20V-DW",
    barcode: "7701234560028",
    power: "20V",
    size: "1/2\"",
    material: "Metal y polímero",
    image: productImage("p-002-taladro-percutor-inalambrico-20v.svg"),
    priceTiers: priceTiers(459900, 2, 6),
    badge: "Más vendido",
    description:
      "Taladro percutor inalámbrico de 20V con batería de litio, motor de alto torque y mandril de 1/2\". Incluye dos baterías, cargador rápido y maletín.",
    specs: [
      { label: "Voltaje", value: "20V MAX" },
      { label: "Torque", value: "65 Nm" },
      { label: "Velocidad", value: "0-2000 RPM" },
      { label: "Mandril", value: '1/2" sin llave' },
      { label: "Batería", value: "2.0 Ah Li-Ion" },
      { label: "Peso", value: "1.6 kg" },
    ],
    compatibilities: ["Baterías DeWalt 20V MAX", "Brocas estándar hasta 13mm", "Puntas de atornillar 1/4\""],
  },
  {
    id: "p-003",
    name: "Juego de Destornilladores 6 Piezas",
    brand: "Stanley",
    category: "herramientas-manuales",
    subcategory: "Destornilladores",
    price: 38900,
    rating: 4.7,
    reviews: 168,
    stock: 130,
    sku: "MAN-DEST-6P-ST",
    barcode: "7701234560035",
    material: "Acero cromo vanadio",
    image: productImage("p-003-juego-destornilladores-6-piezas.svg"),
    priceTiers: priceTiers(38900, 6, 24),
    badge: "Oferta",
    description:
      "Juego de 6 destornilladores con puntas planas y de estrella, mango ergonómico antideslizante y puntas magnéticas de acero cromo vanadio.",
    specs: [
      { label: "Piezas", value: "6" },
      { label: "Material", value: "Cromo vanadio" },
      { label: "Mango", value: "Bimaterial antideslizante" },
      { label: "Puntas", value: "Magnéticas" },
    ],
    compatibilities: ["Tornillos Phillips #1 y #2", "Tornillos planos 3-6mm"],
  },
  {
    id: "p-004",
    name: "Tornillo Drywall 6x1\" (Caja x1000)",
    brand: "Pretul",
    category: "tornilleria",
    subcategory: "Tornillos",
    price: 24500,
    rating: 4.6,
    reviews: 91,
    stock: 540,
    sku: "TOR-DRY-6X1-1K",
    barcode: "7701234560042",
    size: '6 x 1"',
    material: "Acero fosfatado",
    image: productImage("p-004-tornillo-drywall-6x1-caja-x1000.svg"),
    priceTiers: priceTiers(24500, 5, 20),
    description:
      "Caja de 1000 tornillos para drywall punta aguda, cabeza de trompeta y rosca gruesa, ideal para fijación de láminas de yeso a perfiles metálicos.",
    specs: [
      { label: "Cantidad", value: "1000 unidades" },
      { label: "Medida", value: '6 x 1"' },
      { label: "Punta", value: "Aguda" },
      { label: "Acabado", value: "Fosfatado negro" },
    ],
    compatibilities: ["Perfiles metálicos calibre 26", "Láminas de yeso 1/2\""],
  },
  {
    id: "p-005",
    name: "Chapa de Seguridad Pomo Doble",
    brand: "Truper",
    category: "cerrajeria",
    subcategory: "Cerraduras",
    price: 1000,
    oldPrice: 1200,
    rating: 4.5,
    reviews: 73,
    stock: 88,
    sku: "CER-POMO-DOBLE",
    barcode: "7701234560059",
    material: "Acero inoxidable",
    image: productImage("p-005-cerradura-seguridad-pomo-doble.svg"),
    priceTiers: {
      unit: { label: "Unidad", quantity: 1, unitPrice: 1000 },
      inner: { label: "Caja inner", quantity: 10, unitPrice: 900 },
      master: { label: "Caja master", quantity: 30, unitPrice: 850 },
    },
    badge: "Oferta",
    description:
      "Chapa de pomo doble con sistema de seguridad de 5 pines, acabado en acero inoxidable resistente a la corrosión. Incluye 3 llaves.",
    specs: [
      { label: "Tipo", value: "Pomo doble" },
      { label: "Pines", value: "5" },
      { label: "Acabado", value: "Acero inoxidable" },
      { label: "Llaves", value: "3 incluidas" },
    ],
    compatibilities: ['Puertas de 35-45mm de espesor', "Perforación estándar 54mm"],
  },
  {
    id: "p-006",
    name: "Casco de Seguridad Industrial ANSI",
    brand: "3M",
    category: "seguridad-industrial",
    subcategory: "Protección craneal",
    price: 32900,
    rating: 4.8,
    reviews: 142,
    stock: 210,
    sku: "SEG-CASCO-ANSI",
    barcode: "7701234560066",
    material: "Polietileno HD",
    image: productImage("p-006-casco-seguridad-industrial-ansi.svg"),
    priceTiers: priceTiers(32900, 10, 40),
    badge: "Nuevo",
    description:
      "Casco de seguridad certificado ANSI Z89.1, con suspensión de 4 puntos ajustable mediante ratchet y canal para lluvia. Ligero y resistente a impactos.",
    specs: [
      { label: "Norma", value: "ANSI Z89.1" },
      { label: "Suspensión", value: "4 puntos ratchet" },
      { label: "Material", value: "Polietileno HD" },
      { label: "Peso", value: "380 g" },
    ],
    compatibilities: ["Protectores auditivos 3M", "Pantallas faciales acoplables"],
  },
  {
    id: "p-007",
    name: "Pintura Vinilo Tipo 1 Blanco (Galón)",
    brand: "Pretul",
    category: "pinturas-acabados",
    subcategory: "Pintura interior",
    price: 78900,
    oldPrice: 92900,
    rating: 4.4,
    reviews: 56,
    stock: 96,
    sku: "PIN-VIN-T1-GAL",
    barcode: "7701234560073",
    size: "Galón (3.78L)",
    material: "Vinilo acrílico",
    image: productImage("p-007-pintura-vinilo-tipo-1-blanco-galon.svg"),
    priceTiers: priceTiers(78900, 4, 12),
    badge: "Oferta",
    description:
      "Pintura de vinilo tipo 1 lavable para interiores y exteriores, alto rendimiento y excelente cubrimiento. Acabado mate, rinde hasta 40 m² por galón.",
    specs: [
      { label: "Presentación", value: "Galón 3.78L" },
      { label: "Acabado", value: "Mate" },
      { label: "Rendimiento", value: "40 m²/galón" },
      { label: "Secado", value: "1 hora al tacto" },
    ],
    compatibilities: ["Muros de mampostería", "Drywall", "Estuco"],
  },
  {
    id: "p-008",
    name: "Sierra Circular 7-1/4\" 1800W",
    brand: "Makita",
    category: "herramientas-electricas",
    subcategory: "Sierras",
    price: 389900,
    rating: 4.9,
    reviews: 203,
    stock: 28,
    sku: "ELE-SIE-714-MK",
    barcode: "7701234560080",
    power: "1800W",
    size: '7-1/4"',
    material: "Aluminio",
    image: productImage("p-008-sierra-circular-7-1-4-1800w.svg"),
    priceTiers: priceTiers(389900, 2, 6),
    badge: "Más vendido",
    description:
      "Sierra circular de 1800W con disco de 7-1/4\", base de aluminio fundido y guía láser para cortes precisos en madera y derivados.",
    specs: [
      { label: "Potencia", value: "1800W" },
      { label: "Disco", value: '7-1/4" (184mm)' },
      { label: "Velocidad", value: "5200 RPM" },
      { label: "Corte 90°", value: "66 mm" },
    ],
    compatibilities: ["Discos 184mm", "Guías de corte estándar"],
  },
  {
    id: "p-009",
    name: "Martillo de Uña Mango Fibra 16oz",
    brand: "Truper",
    category: "carpinteria",
    subcategory: "Martillos",
    price: 28900,
    rating: 4.7,
    reviews: 119,
    stock: 175,
    sku: "CAR-MAR-16OZ",
    barcode: "7701234560097",
    size: "16 oz",
    material: "Acero forjado",
    image: productImage("p-009-martillo-una-mango-fibra-16oz.svg"),
    priceTiers: priceTiers(28900, 6, 24),
    description:
      "Martillo de uña de 16oz con cabeza de acero forjado y mango de fibra de vidrio con empuñadura antivibración. Equilibrado para mayor precisión.",
    specs: [
      { label: "Peso", value: "16 oz" },
      { label: "Cabeza", value: "Acero forjado" },
      { label: "Mango", value: "Fibra de vidrio" },
    ],
    compatibilities: ["Puntillas de 1\" a 4\""],
  },
  {
    id: "p-010",
    name: "Reflector LED Exterior 50W IP65",
    brand: "Philips",
    category: "iluminacion",
    subcategory: "Reflectores",
    price: 64900,
    oldPrice: 79900,
    rating: 4.6,
    reviews: 87,
    stock: 64,
    sku: "ILU-REF-50W-IP65",
    barcode: "7701234560103",
    power: "50W",
    material: "Aluminio + vidrio templado",
    image: productImage("p-010-reflector-led-exterior-50w-ip65.svg"),
    priceTiers: priceTiers(64900, 6, 24),
    badge: "Oferta",
    description:
      "Reflector LED de 50W con certificación IP65 para exteriores. Luz blanca fría de 6500K, carcasa de aluminio y vidrio templado resistente a la intemperie.",
    specs: [
      { label: "Potencia", value: "50W" },
      { label: "Lúmenes", value: "4500 lm" },
      { label: "Protección", value: "IP65" },
      { label: "Temperatura", value: "6500K fría" },
    ],
    compatibilities: ["Soportes de pared estándar", "Sensores de movimiento"],
  },
  {
    id: "p-011",
    name: "Flexómetro 5m Cinta Métrica",
    brand: "Stanley",
    category: "herramientas-manuales",
    subcategory: "Medición",
    price: 18900,
    rating: 4.8,
    reviews: 240,
    stock: 290,
    sku: "MAN-FLEX-5M",
    barcode: "7701234560110",
    size: "5 m",
    material: "ABS + acero",
    image: productImage("p-011-flexometro-5m-cinta-metrica.svg"),
    priceTiers: priceTiers(18900, 12, 48),
    badge: "Más vendido",
    description:
      "Flexómetro de 5 metros con cinta de acero recubierta, freno automático, clip para cinturón y carcasa de ABS resistente a caídas.",
    specs: [
      { label: "Longitud", value: "5 m" },
      { label: "Ancho cinta", value: "19 mm" },
      { label: "Freno", value: "Automático" },
    ],
    compatibilities: [],
  },
  {
    id: "p-012",
    name: "Bisagra Cierre Suave para Mueble",
    brand: "Pretul",
    category: "carpinteria",
    subcategory: "Herrajes",
    price: 9900,
    rating: 4.5,
    reviews: 64,
    stock: 410,
    sku: "CAR-BIS-SOFT",
    barcode: "7701234560127",
    material: "Acero niquelado",
    image: productImage("p-012-bisagra-cierre-suave-para-mueble.svg"),
    priceTiers: priceTiers(9900, 10, 100),
    badge: "Nuevo",
    description:
      "Bisagra de cazoleta con sistema de cierre suave (soft close) para muebles de cocina y closets. Apertura de 110°, fácil instalación y ajuste en 3 ejes.",
    specs: [
      { label: "Apertura", value: "110°" },
      { label: "Cierre", value: "Suave (soft close)" },
      { label: "Cazoleta", value: "35 mm" },
    ],
    compatibilities: ["Puertas de mueble 16-19mm", "Closets y cocinas"],
  },
]

export function getProduct(id: string) {
  return PRODUCTS.find((p) => p.id === id)
}

export function relatedProducts(p: Product, n = 4) {
  return PRODUCTS.filter((x) => x.category === p.category && x.id !== p.id).slice(0, n)
}

export const TESTIMONIALS = [
  {
    name: "Carlos Mendoza",
    role: "Maestro de obra · Medellín",
    text: "La búsqueda por foto me ahorra horas. Tomo una foto del repuesto y FERREIA me dice exactamente cuál es y dónde está disponible.",
    rating: 5,
  },
  {
    name: "Andrea Gómez",
    role: "Arquitecta · Bogotá",
    text: "El asistente ferretero me arma la lista de materiales completa para cada proyecto. Cotizar nunca había sido tan rápido.",
    rating: 5,
  },
  {
    name: "Ferretería El Tornillo",
    role: "Cliente mayorista · Cali",
    text: "El módulo de inventario transformó nuestra bodega. Ahora sabemos qué falta y cuánto vendemos en tiempo real.",
    rating: 5,
  },
]

// ============================ ADMIN / ERP ===================================

export const KPIS = [
  { label: "Ventas del día", value: "$4.820.000", delta: "+12,4%", positive: true },
  { label: "Ventas del mes", value: "$128.450.000", delta: "+8,1%", positive: true },
  { label: "Productos vendidos", value: "3.412", delta: "+5,6%", positive: true },
  { label: "Productos agotados", value: "18", delta: "+3", positive: false },
  { label: "Utilidad", value: "$41.220.000", delta: "+9,2%", positive: true },
  { label: "Ticket promedio", value: "$86.500", delta: "-2,1%", positive: false },
  { label: "Clientes registrados", value: "2.847", delta: "+64", positive: true },
  { label: "Pedidos pendientes", value: "37", delta: "+11", positive: false },
]

export const SALES_CHART = [
  { mes: "Ene", ventas: 82, compras: 54 },
  { mes: "Feb", ventas: 91, compras: 60 },
  { mes: "Mar", ventas: 104, compras: 71 },
  { mes: "Abr", ventas: 98, compras: 66 },
  { mes: "May", ventas: 118, compras: 78 },
  { mes: "Jun", ventas: 128, compras: 84 },
]

export const CATEGORY_SALES = [
  { name: "H. Eléctricas", value: 38 },
  { name: "Iluminación", value: 24 },
  { name: "Tornillería", value: 18 },
  { name: "Pinturas", value: 12 },
  { name: "Otros", value: 8 },
]

export type InventoryItem = {
  codigoInterno: string
  barcode: string
  sku: string
  nombre: string
  marca: string
  categoria: string
  subcategoria: string
  unidad: string
  costo: number
  precio: number
  stockMin: number
  stockActual: number
  bodega: string
}

export const INVENTORY: InventoryItem[] = PRODUCTS.map((p, i) => ({
  codigoInterno: `INT-${(i + 1).toString().padStart(4, "0")}`,
  barcode: p.barcode,
  sku: p.sku,
  nombre: p.name,
  marca: p.brand,
  categoria: CATEGORIES.find((c) => c.slug === p.category)?.name ?? p.category,
  subcategoria: p.subcategory,
  unidad: "Unidad",
  costo: Math.round(p.price * 0.62),
  precio: p.price,
  stockMin: 20,
  stockActual: p.stock,
  bodega: i % 2 === 0 ? "Bodega Norte" : "Bodega Sur",
}))

export type Customer = {
  id: string
  nombre: string
  tipo: "Persona" | "Empresa"
  ciudad: string
  compras: number
  total: number
  ultimaCompra: string
  segmento: "VIP" | "Frecuente" | "Nuevo"
}

export const CUSTOMERS: Customer[] = [
  { id: "C-001", nombre: "Constructora Andina S.A.S", tipo: "Empresa", ciudad: "Bogotá", compras: 64, total: 48200000, ultimaCompra: "2026-06-15", segmento: "VIP" },
  { id: "C-002", nombre: "Ferretería El Tornillo", tipo: "Empresa", ciudad: "Cali", compras: 52, total: 31400000, ultimaCompra: "2026-06-14", segmento: "VIP" },
  { id: "C-003", nombre: "Carlos Mendoza", tipo: "Persona", ciudad: "Medellín", compras: 18, total: 4200000, ultimaCompra: "2026-06-15", segmento: "Frecuente" },
  { id: "C-004", nombre: "Andrea Gómez", tipo: "Persona", ciudad: "Bogotá", compras: 12, total: 2800000, ultimaCompra: "2026-06-14", segmento: "Frecuente" },
  { id: "C-005", nombre: "Juan Pérez", tipo: "Persona", ciudad: "Barranquilla", compras: 3, total: 320000, ultimaCompra: "2026-06-13", segmento: "Nuevo" },
  { id: "C-006", nombre: "Inmobiliaria Centro", tipo: "Empresa", ciudad: "Bucaramanga", compras: 7, total: 1900000, ultimaCompra: "2026-06-13", segmento: "Frecuente" },
]

export type Supplier = {
  id: string
  nombre: string
  nit: string
  contacto: string
  ciudad: string
  productos: number
  cartera: number
}

export const SUPPLIERS: Supplier[] = [
  { id: "PR-001", nombre: "Distribuidora Bosch Colombia", nit: "900.123.456-1", contacto: "+57 601 444 1100", ciudad: "Bogotá", productos: 86, cartera: 12400000 },
  { id: "PR-002", nombre: "Importadora Truper S.A.", nit: "900.234.567-2", contacto: "+57 604 333 2200", ciudad: "Medellín", productos: 142, cartera: 0 },
  { id: "PR-003", nombre: "Philips Iluminación", nit: "900.345.678-3", contacto: "+57 602 222 3300", ciudad: "Cali", productos: 64, cartera: 5600000 },
  { id: "PR-004", nombre: "Pretul Distribución", nit: "900.456.789-4", contacto: "+57 601 555 4400", ciudad: "Bogotá", productos: 210, cartera: 8900000 },
]

export type Purchase = {
  id: string
  proveedor: string
  fecha: string
  total: number
  estado: "Borrador" | "Enviada" | "Recibida" | "Facturada"
}

export const PURCHASES: Purchase[] = [
  { id: "OC-2041", proveedor: "Distribuidora Bosch Colombia", fecha: "2026-06-14", total: 18400000, estado: "Recibida" },
  { id: "OC-2040", proveedor: "Pretul Distribución", fecha: "2026-06-13", total: 9200000, estado: "Facturada" },
  { id: "OC-2039", proveedor: "Philips Iluminación", fecha: "2026-06-12", total: 5600000, estado: "Enviada" },
  { id: "OC-2038", proveedor: "Importadora Truper S.A.", fecha: "2026-06-10", total: 12100000, estado: "Borrador" },
]

export const DEPARTAMENTOS = [
  "Amazonas", "Antioquia", "Atlántico", "Bolívar", "Boyacá", "Caldas", "Cauca",
  "Cesar", "Córdoba", "Cundinamarca", "Huila", "La Guajira", "Magdalena", "Meta",
  "Nariño", "Norte de Santander", "Quindío", "Risaralda", "Santander", "Tolima",
  "Valle del Cauca", "Bogotá D.C.",
]

export function formatCOP(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value)
}
