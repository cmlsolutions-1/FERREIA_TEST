import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { ferreiaPrisma?: PrismaClient }
export const prisma = globalForPrisma.ferreiaPrisma ?? new PrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.ferreiaPrisma = prisma
