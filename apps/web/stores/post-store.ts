import { create } from "zustand"
import * as postsActions from "@/lib/actions/posts"
import * as postDetailActions from "@/lib/actions/post-detail"
import type { SearchPost, SearchPostMedia } from "@/lib/actions/posts"
import type { PostDetail } from "@/lib/actions/post-detail"

interface PostStoreState {
  postsById: Record<string, SearchPost>
  likedPostIds: Set<string>
  loading: Record<string, boolean>
  error: string | null

  fetchDetail: (postId: string) => Promise<PostDetail | null>
  toggleLike: (postId: string, liked: boolean) => Promise<number | void>
  deletePost: (postId: string) => Promise<void>
  updatePost: (postId: string, content: string, media?: SearchPostMedia[]) => Promise<void>
  cachePosts: (posts: SearchPost[]) => void
  cacheLikedIds: (ids: string[]) => void
  setLoading: (postId: string, loading: boolean) => void
  clear: () => void
}

export const usePostStore = create<PostStoreState>((set, get) => ({
  postsById: {},
  likedPostIds: new Set<string>(),
  loading: {},
  error: null,

  fetchDetail: async (postId) => {
    set((s) => ({ loading: { ...s.loading, [postId]: true }, error: null }))
    try {
      const detail = await postDetailActions.getPostDetail(postId)
      if (detail) {
        set((s) => ({
          postsById: { ...s.postsById, [postId]: detail.post },
          likedPostIds: detail.likedByMe ? new Set([...s.likedPostIds, postId]) : s.likedPostIds,
          loading: { ...s.loading, [postId]: false },
        }))
      } else {
        set((s) => ({ loading: { ...s.loading, [postId]: false } }))
      }
      return detail
    } catch (e) {
      set((s) => ({
        error: (e as Error).message,
        loading: { ...s.loading, [postId]: false },
      }))
      return null
    }
  },

  toggleLike: async (postId, liked) => {
    const prev = get().likedPostIds.has(postId)
    set((s) => {
      const next = new Set(s.likedPostIds)
      if (liked) next.add(postId)
      else next.delete(postId)
      return { likedPostIds: next }
    })
    try {
      const { likesCount } = await postsActions.toggleLike(postId, liked)
      set((s) => ({
        postsById: s.postsById[postId]
          ? { ...s.postsById, [postId]: { ...s.postsById[postId], likesCount } }
          : s.postsById,
      }))
      return likesCount
    } catch (e) {
      set((s) => {
        const rollback = new Set(s.likedPostIds)
        if (prev) rollback.add(postId)
        else rollback.delete(postId)
        return { likedPostIds: rollback }
      })
      const status = (e as { response?: { status?: number } })?.response?.status
      if (status === 409 || status === 404) return
      throw e
    }
  },

  deletePost: async (postId) => {
    try {
      await postsActions.deletePost(postId)
      set((s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [postId]: _, ...rest } = s.postsById
        const nextLiked = new Set(s.likedPostIds)
        nextLiked.delete(postId)
        return { postsById: rest, likedPostIds: nextLiked }
      })
    } catch {
      // silently fail
    }
  },

  updatePost: async (postId, content, media) => {
    try {
      await postsActions.updatePost(postId, content, media)
      set((s) => ({
        postsById: s.postsById[postId]
          ? {
              ...s.postsById,
              [postId]: {
                ...s.postsById[postId],
                content,
                media: media ?? s.postsById[postId].media,
              },
            }
          : s.postsById,
      }))
    } catch {
      // silently fail
    }
  },

  cachePosts: (posts) => {
    set((s) => {
      const map: Record<string, SearchPost> = {}
      for (const p of posts) map[p._id] = s.postsById[p._id] ?? p
      return { postsById: { ...s.postsById, ...map } }
    })
  },

  cacheLikedIds: (ids) => {
    set((s) => ({ likedPostIds: new Set([...s.likedPostIds, ...ids]) }))
  },

  setLoading: (postId, loading) => {
    set((s) => ({ loading: { ...s.loading, [postId]: loading } }))
  },

  clear: () => {
    set({ postsById: {}, likedPostIds: new Set(), loading: {}, error: null })
  },
}))
