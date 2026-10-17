import { z } from "zod"
export const customerLoginSchema = z.object({ email: z.email().max(254), password: z.string().min(1).max(128) }).strict()
export const customerRegisterSchema = z.object({
  name: z.string().trim().min(3).max(120),
  document: z.string().trim().min(3).max(40),
  email: z.email().max(254),
  phone: z.string().trim().min(5).max(30),
  password: z.string().min(12).max(128),
}).strict()
