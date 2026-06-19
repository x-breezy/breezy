"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useProfilePosts } from "./use-profile-posts"
import { getPostsContext } from "@/lib/actions/post-detail"
import type { CommentNode } from "../post/comment-tree"
import type { ProfileRef } from "@/lib/actions/post-detail"

export function useProfileReplies(authorId: string, profileRef: ProfileRef | null, enabled = true) {
  const {
    posts: replies,
    isLoading,
    fetchNextPage,
    hasNextPage,
    error,
  } = useProfilePosts(authorId, "replies", enabled)

  const parentIds = useMemo(() => {
    const ids = replies.map((r) => r.parentId).filter(Boolean) as string[]
    return [...new Set(ids)]
  }, [replies])

  const { data: contextData, isLoading: isLoadingContext } = useQuery({
    queryKey: ["parent-context", parentIds.slice().sort()],
    queryFn: () => getPostsContext(parentIds),
    enabled: parentIds.length > 0 && enabled,
  })

  const threads = useMemo<CommentNode[]>(() => {
    const data = contextData
    if (!data || data.length === 0) return []

    const parentMap = new Map(data.map((d) => [d.post._id, d.post]))

    const grouped = new Map<string, typeof replies>()
    for (const reply of replies) {
      if (!reply.parentId) continue
      const group = grouped.get(reply.parentId) ?? []
      group.push(reply)
      grouped.set(reply.parentId, group)
    }

    const result: CommentNode[] = []
    for (const [parentId, userReplies] of grouped) {
      const parent = parentMap.get(parentId)
      if (!parent) continue

      const replyNodes: CommentNode[] = userReplies.map((reply) => ({
        _id: reply._id,
        content: reply.content,
        authorId: reply.authorId,
        parentId: reply.parentId,
        tags: reply.tags,
        mentions: reply.mentions,
        media: reply.media,
        likesCount: reply.likesCount,
        commentsCount: reply.commentsCount,
        createdAt: reply.createdAt,
        author: profileRef,
        likedByMe: reply.liked,
        replies: [],
      }))

      result.push({
        _id: parent._id,
        content: parent.content,
        authorId: parent.authorId,
        tags: parent.tags,
        mentions: parent.mentions,
        media: parent.media,
        likesCount: parent.likesCount,
        commentsCount: parent.commentsCount,
        createdAt: parent.createdAt,
        author: parent.author,
        likedByMe: false,
        replies: replyNodes,
      })
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [replies, contextData, profileRef])

  return {
    threads,
    isLoading,
    isLoadingContext,
    fetchNextPage,
    hasNextPage,
    error,
  }
}
