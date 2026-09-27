import { z } from "zod"

export const reportExportSchema = z.object({ kind: z.enum(["summary", "sales", "inventory", "purchases"]) })
