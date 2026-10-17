import { z } from "zod"

export const adminLoginSchema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(128) }).strict()
