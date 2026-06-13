import { create } from "zustand"
import type { Notification } from "@/types/notification"
import * as actions from "@/app/(app)/notifications/actions"

interface NotificationState {
  notifications: Notification[]
  total: number
  page: number
  limit: number
  unreadCount: number
  loading: boolean
  lastNew: Notification | null
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
  lastNew: null,
  error: null,

  list: async (options) => {
    set({ loading: true, error: null })
    try {
      const res = await actions.listNotifications(
        options?.page ?? get().page,
        options?.limit ?? get().limit
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
      await actions.markNotificationRead(id)
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
      await actions.markAllNotificationsRead()
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
      await actions.deleteNotification(id)
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
    set((state) => {
      const actorId = notification.payload?.actorId ?? notification.payload?.followerId
      const isDuplicateFollow =
        notification.type === "follow" &&
        !!actorId &&
        state.notifications.some(
          (n) => n.type === "follow" && (n.payload.actorId ?? n.payload.followerId) === actorId
        )

      if (isDuplicateFollow) {
        const replaced = state.notifications.find(
          (n) => n.type === "follow" && (n.payload.actorId ?? n.payload.followerId) === actorId
        )!
        return {
          notifications: [notification, ...state.notifications.filter((n) => n !== replaced)],
          total: state.total,
          unreadCount: state.unreadCount + (replaced.read && !notification.read ? 1 : 0),
          lastNew: state.lastNew,
        }
      }

      return {
        notifications: [notification, ...state.notifications],
        total: state.total + 1,
        unreadCount: state.unreadCount + (notification.read ? 0 : 1),
        lastNew: notification,
      }
    })
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
