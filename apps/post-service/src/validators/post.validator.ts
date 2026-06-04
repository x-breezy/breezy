import { z } from "zod"

export const createPostBodySchema = z.object({
  content: z.string().min(1, "content must not be empty"),
  tags: z.array(z.string()).optional().default([]),
  mediaIds: z.array(z.string()).optional().default([]),
})

export const ownerHeaderSchema = z.object({
  "x-owner-id": z.string().min(1, "x-owner-id header is required"),
})

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
