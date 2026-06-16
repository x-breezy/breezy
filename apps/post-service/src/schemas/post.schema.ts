import { z } from "zod"

const mediaRefSchema = z.object({
  id: z.string(),
  type: z.enum(["image", "video"]),
})

export const createPostSchema = z.object({
  content: z.string().min(1).max(250),
  tags: z.array(z.string()).optional(),
  mentions: z.array(z.string().uuid()).optional(),
  media: z.array(mediaRefSchema).optional(),
  parentId: z.string().optional(),
})

export type CreatePostDTO = z.infer<typeof createPostSchema>
