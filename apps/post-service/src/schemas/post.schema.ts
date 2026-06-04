import { z } from "zod"

export const createPostSchema = z.object({
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
  mediaIds: z.array(z.string()).optional(),
})

export type CreatePostDTO = z.infer<typeof createPostSchema>
