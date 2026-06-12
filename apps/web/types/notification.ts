export type NotificationType = "follow" | "like" | "mention" | "comment"

export interface Notification {
  _id: string
  userId: string
  type: NotificationType
  read: boolean
  payload: Record<string, string | undefined>
  createdAt: string
  updatedAt: string
}

export interface NotificationListResponse {
  success: boolean
  data: Notification[]
  total: number
  page: number
  limit: number
}
