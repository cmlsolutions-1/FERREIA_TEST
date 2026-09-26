import type { Prisma } from "@prisma/client"
import type { z } from "zod"
import { classificationRepository } from "@/server/modules/classifications/classification.repository"
import { classificationFiltersSchema, createClassificationSchema, updateClassificationSchema } from "@/server/modules/classifications/classification.schema"
import { ApiError } from "@/server/shared/api-error"
import { paginationMeta } from "@/server/shared/pagination"

type Kind = "LINE" | "GROUP" | "SUBGROUP"
const parentKind: Record<Kind, Kind | null> = { LINE: null, GROUP: "LINE", SUBGROUP: "GROUP" }

export const classificationService = {
  async list(filters: z.infer<typeof classificationFiltersSchema>) {
    const where: Prisma.ProductClassificationWhereInput = {
      ...(filters.kind ? { kind: filters.kind } : {}),
      ...(filters.active ? { active: filters.active === "true" } : {}),
      ...(filters.search ? { name: { contains: filters.search, mode: "insensitive" } } : {}),
    }
    const [data, total] = await Promise.all([
      classificationRepository.list(where, (filters.page - 1) * filters.limit, filters.limit),
      classificationRepository.count(where),
    ])
    return { data, meta: paginationMeta(filters.page, filters.limit, total) }
  },
  async get(id: string) {
    const record = await classificationRepository.find(id)
    if (!record) throw new ApiError(404, "CLASSIFICATION_NOT_FOUND", "No se encontró la clasificación")
    return record
  },
  async create(input: z.infer<typeof createClassificationSchema>) {
    const requiredParent = parentKind[input.kind]
    if ((requiredParent === null && input.parentId !== null) || (requiredParent !== null && !input.parentId)) {
      throw new ApiError(422, "INVALID_CLASSIFICATION_PARENT", "Selecciona un nivel padre válido")
    }
    if (requiredParent && input.parentId) {
      const parent = await classificationRepository.find(input.parentId)
      if (!parent || parent.kind !== requiredParent || !parent.active) {
        throw new ApiError(422, "INVALID_CLASSIFICATION_PARENT", "Selecciona un nivel padre activo y válido")
      }
    }
    if (await classificationRepository.findSibling(input.kind, input.parentId, input.name)) {
      throw new ApiError(409, "DUPLICATE_RECORD", "Ya existe una clasificación con ese nombre en el mismo nivel")
    }
    return classificationRepository.create({ id: `${input.kind}-${crypto.randomUUID()}`, ...input })
  },
  async update(id: string, input: z.infer<typeof updateClassificationSchema>) {
    const current = await this.get(id)
    if (input.name && input.name.toLowerCase() !== current.name.toLowerCase()) {
      const sibling = await classificationRepository.findSibling(current.kind, current.parentId, input.name)
      if (sibling && sibling.id !== id) throw new ApiError(409, "DUPLICATE_RECORD", "Ya existe una clasificación con ese nombre en el mismo nivel")
    }
    if (input.active && current.parentId) {
      const parent = await classificationRepository.find(current.parentId)
      if (!parent?.active) throw new ApiError(422, "INVALID_CLASSIFICATION_PARENT", "Activa primero el nivel padre")
    }
    if (input.active === false) {
      const children = await classificationRepository.count({ parentId: id, active: true })
      if (children) throw new ApiError(409, "CLASSIFICATION_HAS_ACTIVE_CHILDREN", "Desactiva primero sus grupos o subgrupos")
    }
    return classificationRepository.update(id, input)
  },
}
