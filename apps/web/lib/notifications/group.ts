import type { Notification } from "@/types/notification"

export interface ActorInfo {
  id: string
  username: string
  avatarId: string | null
}

export type NotificationView =
  | { kind: "follow"; ids: string[]; actor: ActorInfo; read: boolean; createdAt: string }
  | {
      kind: "mention"
      ids: string[]
      actor: ActorInfo
      postId: string
      read: boolean
      createdAt: string
    }
  | {
      kind: "comment"
      ids: string[]
      actor: ActorInfo
      postId: string
      read: boolean
      createdAt: string
    }
  | {
      kind: "like"
      ids: string[]
      postId: string
      actors: ActorInfo[]
      read: boolean
      createdAt: string
    }

function toActorInfo(payload: Record<string, string | undefined>): ActorInfo {
  const id = payload.actorId ?? payload.followerId ?? ""
  return {
    id,
    username: payload.username ?? id,
    avatarId: payload.avatarId ?? null,
  }
}

export function groupNotifications(list: Notification[]): NotificationView[] {
  type LikeGroup = {
    ids: string[]
    actors: ActorInfo[]
    seenActors: Set<string>
    read: boolean
    createdAt: string
  }

  type FollowGroup = { ids: string[]; actor: ActorInfo; read: boolean; createdAt: string }

  const likesByPost = new Map<string, LikeGroup>()
  const followsByActor = new Map<string, FollowGroup>()
  const views: NotificationView[] = []

  for (const n of list) {
    if (n.type === "like") {
      const postId = n.payload.postId ?? ""
      if (!postId) continue
      const actor = toActorInfo(n.payload)
      const existing = likesByPost.get(postId)
      if (!existing) {
        likesByPost.set(postId, {
          ids: [n._id],
          actors: actor.id ? [actor] : [],
          seenActors: new Set(actor.id ? [actor.id] : []),
          read: n.read,
          createdAt: n.createdAt,
        })
      } else {
        existing.ids.push(n._id)
        if (actor.id && !existing.seenActors.has(actor.id)) {
          existing.actors.push(actor)
          existing.seenActors.add(actor.id)
        }
        if (!n.read) existing.read = false
        if (n.createdAt > existing.createdAt) existing.createdAt = n.createdAt
      }
    } else if (n.type === "follow") {
      const actor = toActorInfo(n.payload)
      if (!actor.id) continue
      const existing = followsByActor.get(actor.id)
      if (!existing) {
        followsByActor.set(actor.id, { ids: [n._id], actor, read: n.read, createdAt: n.createdAt })
      } else {
        existing.ids.push(n._id)
        if (!n.read) existing.read = false
        if (n.createdAt > existing.createdAt) {
          existing.createdAt = n.createdAt
          existing.actor = actor
        }
      }
    } else if (n.type === "mention") {
      views.push({
        kind: "mention",
        ids: [n._id],
        actor: toActorInfo(n.payload),
        postId: n.payload.postId ?? "",
        read: n.read,
        createdAt: n.createdAt,
      })
    } else if (n.type === "comment") {
      views.push({
        kind: "comment",
        ids: [n._id],
        actor: toActorInfo(n.payload),
        postId: n.payload.postId ?? "",
        read: n.read,
        createdAt: n.createdAt,
      })
    }
  }

  for (const data of followsByActor.values()) {
    views.push({
      kind: "follow",
      ids: data.ids,
      actor: data.actor,
      read: data.read,
      createdAt: data.createdAt,
    })
  }

  for (const [postId, data] of likesByPost) {
    views.push({
      kind: "like",
      ids: data.ids,
      postId,
      actors: data.actors,
      read: data.read,
      createdAt: data.createdAt,
    })
  }

  return views.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
}

export type TimeFrameGroup = { label: string; views: NotificationView[] }

export function groupByTimeFrame(views: NotificationView[]): TimeFrameGroup[] {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday.getTime() - 86_400_000)
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 86_400_000)
  const startOfMonth = new Date(startOfToday.getTime() - 29 * 86_400_000)

  const buckets: Record<string, NotificationView[]> = {
    today: [],
    yesterday: [],
    lastWeek: [],
    lastMonth: [],
  }

  for (const v of views) {
    const d = new Date(v.createdAt)
    if (d >= startOfToday) buckets["today"]!.push(v)
    else if (d >= startOfYesterday) buckets["yesterday"]!.push(v)
    else if (d >= startOfWeek) buckets["lastWeek"]!.push(v)
    else if (d >= startOfMonth) buckets["lastMonth"]!.push(v)
  }

  return (["today", "yesterday", "lastWeek", "lastMonth"] as const)
    .filter((label) => buckets[label]!.length > 0)
    .map((label) => ({ label, views: buckets[label]! }))
}
