import { z } from "zod"

const mediaRefSchema = z.object({
  id: z.string(),
  type: z.enum(["image", "video"]),
})

export const createPostSchema = z.object({
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
  media: z.array(mediaRefSchema).optional(),
})

export type CreatePostDTO = z.infer<typeof createPostSchema>
