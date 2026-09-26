import { prisma } from "@/server/database/prisma"

export const authRepository = {
  findByEmail(email: string) { return prisma.customer.findUnique({ where: { email } }) },
  findSession(tokenHash: string) { return prisma.authSession.findUnique({ where: { tokenHash }, include: { user: true } }) },
  createSession(userId: string, tokenHash: string, expiresAt: Date) { return prisma.authSession.create({ data: { userId, tokenHash, expiresAt } }) },
  deleteSession(tokenHash: string) { return prisma.authSession.deleteMany({ where: { tokenHash } }) },
}
