import { Prisma } from "@prisma/client"
import { ZodError } from "zod"

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message)
    this.name = "ApiError"
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (error instanceof ZodError) return new ApiError(400, "VALIDATION_ERROR", "Los datos enviados no son válidos", error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })))
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return new ApiError(409, "DUPLICATE_RECORD", "Ya existe un registro con estos datos")
    if (error.code === "P2003") return new ApiError(409, "RECORD_IN_USE", "El registro tiene relaciones asociadas")
    if (error.code === "P2025") return new ApiError(404, "NOT_FOUND", "No se encontró el registro")
    console.error("Prisma request failed", { code: error.code })
    return new ApiError(500, "DATABASE_ERROR", "No fue posible completar la operación en la base de datos")
  }
  if (error instanceof Prisma.PrismaClientInitializationError || error instanceof Prisma.PrismaClientRustPanicError) {
    console.error("Prisma connection failed", { name: error.name })
    return new ApiError(503, "DATABASE_ERROR", "La base de datos no está disponible")
  }
  console.error("Unexpected API failure", error instanceof Error ? { name: error.name, message: error.message } : { type: typeof error })
  return new ApiError(500, "INTERNAL_SERVER_ERROR", "Ocurrió un error interno")
}
