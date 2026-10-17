import { prisma } from "@/server/database/prisma"

export const authRepository = {
  findByEmail(email: string) { return prisma.customer.findUnique({ where: { email } }) },
  findSession(tokenHash: string) { return prisma.authSession.findUnique({ where: { tokenHash }, include: { user: true } }) },
  async createSession(userId: string, tokenHash: string, expiresAt: Date) {
    const now = new Date()
    await prisma.authSession.deleteMany({ where: { OR: [{ expiresAt: { lt: now } }, { userId, createdAt: { lt: new Date(now.getTime() - 30 * 86400000) } }] } })
    return prisma.authSession.create({ data: { userId, tokenHash, expiresAt } })
  },
  deleteSession(tokenHash: string) { return prisma.authSession.deleteMany({ where: { tokenHash } }) },
}
