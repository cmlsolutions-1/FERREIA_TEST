import { prisma } from "@/server/database/prisma"
import { handleApi, success } from "@/server/shared/api-response"

export const runtime = "nodejs"

export async function GET() {
  return handleApi(async () => {
    await prisma.$queryRaw`SELECT 1`
    return success("FERREIA API is running", { database: "connected" })
  })
}
