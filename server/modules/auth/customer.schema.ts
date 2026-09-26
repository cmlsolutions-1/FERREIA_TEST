import { z } from "zod"
export const customerLoginSchema = z.object({ email: z.email(), password: z.string().min(1) }).strict()
export const customerRegisterSchema = z.object({ name: z.string().trim().min(3), document: z.string().trim().min(1), email: z.email(), phone: z.string().trim().min(1), password: z.string().min(8) }).strict()
