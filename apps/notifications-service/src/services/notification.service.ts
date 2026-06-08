import { NotificationModel, type NotificationType } from "../models/notification.model"
import { sseService } from "./sse.service"

interface CreateNotificationInput {
  userId: string
  type: NotificationType
  payload: Record<string, string | undefined>
}

interface ListOptions {
  page: number
  limit: number
  read?: boolean
}

class NotificationService {
  async create(input: CreateNotificationInput): Promise<void> {
    const notification = await NotificationModel.create(input)
    sseService.push(input.userId, notification.toJSON())
  }

  async list(
    userId: string,
    options: ListOptions
  ): Promise<{ data: object[]; total: number; page: number; limit: number }> {
    const filter: Record<string, unknown> = { userId }
    if (options.read !== undefined) filter.read = options.read

    const skip = (options.page - 1) * options.limit
    const [data, total] = await Promise.all([
      NotificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(options.limit).exec(),
      NotificationModel.countDocuments(filter),
    ])

    return { data, total, page: options.page, limit: options.limit }
  }

  async markRead(id: string, userId: string): Promise<boolean> {
    const result = await NotificationModel.findOneAndUpdate(
      { _id: id, userId },
      { read: true }
    ).exec()
    return result !== null
  }

  async markAllRead(userId: string): Promise<void> {
    await NotificationModel.updateMany({ userId, read: false }, { read: true }).exec()
  }

  async remove(id: string, userId: string): Promise<boolean> {
    const result = await NotificationModel.findOneAndDelete({ _id: id, userId }).exec()
    return result !== null
  }
}

export default NotificationService
