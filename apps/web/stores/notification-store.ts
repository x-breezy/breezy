import { create } from "zustand"
import type { Notification } from "@/types/notification"
import * as notificationService from "@/lib/services/notification-service"

interface NotificationState {
  notifications: Notification[]
  total: number
  page: number
  limit: number
  unreadCount: number
  loading: boolean
  error: string | null

  list: (options?: { page?: number; limit?: number; unreadOnly?: boolean }) => Promise<void>
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  remove: (id: string) => Promise<void>
  prepend: (notification: Notification) => void
  clear: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  total: 0,
  page: 1,
  limit: 20,
  unreadCount: 0,
  loading: false,
  error: null,

  list: async (options) => {
    set({ loading: true, error: null })
    try {
      const res = await notificationService.listNotifications(
        options?.page ?? get().page,
        options?.limit ?? get().limit,
        options?.unreadOnly
      )
      set({
        notifications: res.data,
        total: res.total,
        page: res.page,
        limit: res.limit,
        unreadCount: res.data.filter((n) => !n.read).length,
        loading: false,
      })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  markRead: async (id) => {
    try {
      await notificationService.markNotificationRead(id)
      set((state) => ({
        notifications: state.notifications.map((n) => (n._id === id ? { ...n, read: true } : n)),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }))
    } catch {
      // silently fail, optimistic update may rollback
    }
  },

  markAllRead: async () => {
    try {
      await notificationService.markAllNotificationsRead()
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }))
    } catch {
      // silently fail
    }
  },

  remove: async (id) => {
    try {
      await notificationService.deleteNotification(id)
      set((state) => {
        const removed = state.notifications.find((n) => n._id === id)
        return {
          notifications: state.notifications.filter((n) => n._id !== id),
          total: state.total - 1,
          unreadCount: state.unreadCount - (removed?.read ? 0 : 1),
        }
      })
    } catch {
      // silently fail
    }
  },

  prepend: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      total: state.total + 1,
      unreadCount: state.unreadCount + (notification.read ? 0 : 1),
    }))
  },

  clear: () =>
    set({
      notifications: [],
      total: 0,
      page: 1,
      limit: 20,
      unreadCount: 0,
      loading: false,
      error: null,
    }),
}))
