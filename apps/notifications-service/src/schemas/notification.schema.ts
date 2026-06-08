import { z } from "zod"

export const notificationIdParamSchema = z.object({
  id: z.string().min(1),
})

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  read: z
    .string()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined))
    .optional(),
})

export type NotificationIdParamDTO = z.infer<typeof notificationIdParamSchema>
export type ListNotificationsQueryDTO = z.infer<typeof listNotificationsQuerySchema>
