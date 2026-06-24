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

export const pushSubscribeBodySchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    auth: z.string().min(1),
    p256dh: z.string().min(1),
  }),
})

export const pushUnsubscribeBodySchema = z.object({
  endpoint: z.string().url(),
})

export type PushSubscribeBodyDTO = z.infer<typeof pushSubscribeBodySchema>
export type PushUnsubscribeBodyDTO = z.infer<typeof pushUnsubscribeBodySchema>
