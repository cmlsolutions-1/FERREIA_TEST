import { z } from "zod"

export const createCrmCustomerSchema = z.object({
  name: z.string().trim().min(2).max(160),
  type: z.enum(["Persona", "Empresa"]),
  document: z.string().trim().max(40).optional().default(""),
  email: z.union([z.email(), z.literal("")]).optional().default(""),
  phone: z.string().trim().min(5).max(40),
  city: z.string().trim().min(2).max(100),
}).strict().refine((value) => Boolean(value.document || value.email), { message: "Ingresa un documento o correo para relacionar sus compras", path: ["document"] })
