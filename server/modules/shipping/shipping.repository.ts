import { prisma } from "@/server/database/prisma"
export const shippingRepository = {
  get() { return prisma.shippingConfiguration.findUnique({ where: { id: "default" }, include: { methods: true, zones: true } }) },
  async save(input: { enabled: boolean; freeShipping: { enabled: boolean; byAmount: boolean; minimumAmount: number; byQuantity: boolean; minimumQuantity: number; mode: string }; standard: { active: boolean; baseCost: number; minDays: number; maxDays: number; freeShippingEligible: boolean }; express: { active: boolean; baseCost: number; minDays: number; maxDays: number; freeShippingEligible: boolean }; zones: Array<{ id: string; name: string; departments: string[]; surcharge: number; active: boolean }> }) {
    await prisma.$transaction(async (tx) => {
      await tx.shippingConfiguration.upsert({ where: { id: "default" }, create: { id: "default", enabled: input.enabled, freeEnabled: input.freeShipping.enabled, freeByAmount: input.freeShipping.byAmount, minimumAmount: input.freeShipping.minimumAmount, freeByQuantity: input.freeShipping.byQuantity, minimumQuantity: input.freeShipping.minimumQuantity, freeMode: input.freeShipping.mode }, update: { enabled: input.enabled, freeEnabled: input.freeShipping.enabled, freeByAmount: input.freeShipping.byAmount, minimumAmount: input.freeShipping.minimumAmount, freeByQuantity: input.freeShipping.byQuantity, minimumQuantity: input.freeShipping.minimumQuantity, freeMode: input.freeShipping.mode } })
      for (const [id, method] of [["standard", input.standard], ["express", input.express]] as const) await tx.shippingMethod.upsert({ where: { id }, create: { id, configurationId: "default", active: method.active, baseCost: method.baseCost, minDays: method.minDays, maxDays: method.maxDays, freeEligible: method.freeShippingEligible }, update: { active: method.active, baseCost: method.baseCost, minDays: method.minDays, maxDays: method.maxDays, freeEligible: method.freeShippingEligible } })
      await tx.shippingZone.deleteMany({ where: { configurationId: "default" } })
      await tx.shippingZone.createMany({ data: input.zones.map((zone) => ({ ...zone, configurationId: "default" })) })
    })
    return this.get()
  },
}
