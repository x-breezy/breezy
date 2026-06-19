import { z } from "zod"

export const uploadHeadersSchema = z.object({
  "content-type": z
    .string()
    .min(1)
    .regex(/^image\//),
  "x-filename": z.string().default("upload"),
})
