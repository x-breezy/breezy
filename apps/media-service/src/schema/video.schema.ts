import { z } from "zod"

export const uploadHeadersSchema = z.object({
  "content-type": z.string().min(1),
  "x-filename": z.string().default("upload"),
  "x-title": z.string().optional(),
})
