import { z } from "zod"

export const uploadHeadersSchema = z.object({
  "content-type": z.string().regex(/^video\//),
  "x-filename": z.string().default("upload"),
  "x-title": z.string().optional(),
})
