import { INVENTORY } from "@/lib/data"

export type WarehouseRecord = { id: string; code: string; name: string; address: string; manager: string; type: "Principal" | "Auxiliar" | "Punto de venta"; active: boolean }
export type ProductMaster = {
  id: string; reference: string; supplierReference: string; name: string; sku: string
  barcodes: { presentation: "Unidad" | "Inner" | "Master" | "Alterno"; code: string }[]
  line: string; brand: string; group: string; subgroup: string; packaging: { inner: number; master: number }
  unit: string; weight: number; cost: number; price: number; taxRate: number; warehouse: string
  stock: number; stockMin: number; stockMax: number; images: string[]; suppliers: string[]
  characteristics: string; active: boolean
}

export const PRODUCT_STORAGE_KEY = "ferreia-admin-inventory-products-v2"
export const WAREHOUSE_STORAGE_KEY = "ferreia-admin-warehouses"
export const initialWarehouses: WarehouseRecord[] = [
  { id: "WH-001", code: "BOD-01", name: "Bodega Principal", address: "Centro de distribución", manager: "Coordinador de inventarios", type: "Principal", active: true },
  { id: "WH-002", code: "BOD-02", name: "Bodega Norte", address: "Zona norte", manager: "Jefe de bodega norte", type: "Auxiliar", active: true },
  { id: "WH-003", code: "BOD-03", name: "Bodega Sur", address: "Zona sur", manager: "Jefe de bodega sur", type: "Auxiliar", active: true },
  { id: "WH-004", code: "PDV-01", name: "Mostrador", address: "Sede comercial", manager: "Administrador de tienda", type: "Punto de venta", active: true },
]
export const initialProductMaster: ProductMaster[] = INVENTORY.map((item, index) => ({
  id: item.sku, reference: String(index + 1).padStart(5, "0"), supplierReference: `PROV-${item.sku}`, name: item.nombre, sku: item.sku,
  barcodes: [{ presentation: "Unidad", code: item.barcode }, { presentation: "Inner", code: `${item.barcode}-IN` }, { presentation: "Master", code: `${item.barcode}-MA` }],
  line: item.categoria, brand: item.marca, group: item.categoria, subgroup: item.subcategoria,
  packaging: { inner: 10, master: 30 }, unit: item.unidad, weight: 0, cost: item.costo, price: item.precio, taxRate: 19,
  warehouse: item.bodega, stock: item.stockActual, stockMin: item.stockMin, stockMax: Math.max(item.stockMin * 5, item.stockActual + 50),
  images: [], suppliers: [index % 2 ? "Importadora Truper S.A." : "Distribuidora Bosch Colombia"], characteristics: `${item.marca} · ${item.subcategoria}`, active: true,
}))
export function nextReference(products: ProductMaster[]) { return String(Math.max(0, ...products.map((p) => Number(p.reference) || 0)) + 1).padStart(5, "0") }
