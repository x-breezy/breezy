import { create } from "zustand"
import { searchPosts, getLikedPostIds, toggleLike } from "@/lib/actions/posts"
import {
  searchProfiles,
  fetchProfilesByIds,
  followProfile,
  unfollowProfile,
} from "@/lib/actions/profiles"
import { collectMedia, profilesToPeople, type MergedPerson } from "@/components/search/search-utils"
import type { SearchPost, PaginatedResult } from "@/lib/actions/posts"
import type { SearchProfile } from "@/lib/actions/profiles"
import type { Tab } from "@/components/search/types"

interface TabCache {
  fetchedQ: string
}

export interface PostsCache extends TabCache {
  posts: SearchPost[]
  profiles: SearchProfile[]
  likedIds: Set<string>
  total: number
}

export interface PeopleCache extends TabCache {
  people: MergedPerson[]
  total: number
}

export interface MediaCache extends TabCache {
  media: { id: string; type: "image" | "video" }[]
  total: number
}

interface SearchStoreState {
  postsCache: PostsCache | null
  peopleCache: PeopleCache | null
  mediaCache: MediaCache | null
  profileMap: Map<string, SearchProfile>
  loading: boolean
  error: string | null

  search: (q: string, tab: Tab) => Promise<void>
  handleLike: (postId: string, liked: boolean) => Promise<number | void>
  handleFollow: (id: string, follow: boolean) => Promise<void>
  clear: () => void
}

export const useSearchStore = create<SearchStoreState>((set, get) => ({
  postsCache: null,
  peopleCache: null,
  mediaCache: null,
  profileMap: new Map(),
  loading: false,
  error: null,

  search: async (q, tab) => {
    if (!q) return

    set({ loading: true, error: null })

    try {
      if (tab === "posts") {
        const s = get()
        if (s.postsCache && s.postsCache.fetchedQ === q) {
          set({ loading: false })
          return
        }
        const postsRes: PaginatedResult<SearchPost> = await searchPosts(q)
        const authorIds = [...new Set(postsRes.data.map((p) => p.authorId))]
        const postIds = postsRes.data.map((p) => p._id)
        const [profiles, likedIds] = await Promise.all([
          fetchProfilesByIds(authorIds),
          getLikedPostIds(postIds).catch(() => [] as string[]),
        ])
        const profileMap = new Map(profiles.map((p) => [p.profileId, p]))
        set({
          postsCache: {
            posts: postsRes.data,
            profiles,
            likedIds: new Set(likedIds),
            total: postsRes.total,
            fetchedQ: q,
          },
          profileMap,
          loading: false,
        })
      } else if (tab === "people") {
        const s = get()
        if (s.peopleCache && s.peopleCache.fetchedQ === q) {
          set({ loading: false })
          return
        }
        const profilesRes = await searchProfiles(q)
        const people = profilesToPeople(profilesRes.profiles)
        set({ peopleCache: { people, total: profilesRes.total, fetchedQ: q }, loading: false })
      } else if (tab === "media") {
        const s = get()
        if (s.mediaCache && s.mediaCache.fetchedQ === q) {
          set({ loading: false })
          return
        }
        if (s.postsCache && s.postsCache.fetchedQ === q) {
          const media = collectMedia(s.postsCache.posts)
          set({ mediaCache: { media, total: media.length, fetchedQ: q }, loading: false })
          return
        }
        const postsRes = await searchPosts(q)
        const media = collectMedia(postsRes.data)
        set({ mediaCache: { media, total: media.length, fetchedQ: q }, loading: false })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error during search"
      set({ error: msg, loading: false })
      if (tab === "posts") {
        set({ postsCache: { posts: [], profiles: [], likedIds: new Set(), total: 0, fetchedQ: q } })
      } else if (tab === "people") {
        set({ peopleCache: { people: [], total: 0, fetchedQ: q } })
      } else if (tab === "media") {
        set({ mediaCache: { media: [], total: 0, fetchedQ: q } })
      }
    }
  },

  handleLike: async (postId, liked) => {
    try {
      const { likesCount } = await toggleLike(postId, liked)
      set((s) => {
        if (!s.postsCache) return s
        const newLikedIds = new Set(s.postsCache.likedIds)
        if (liked) newLikedIds.add(postId)
        else newLikedIds.delete(postId)
        return {
          postsCache: {
            ...s.postsCache,
            likedIds: newLikedIds,
            posts: s.postsCache.posts.map((p) => (p._id === postId ? { ...p, likesCount } : p)),
          },
        }
      })
      return likesCount
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 409 || status === 404) return
      throw err
    }
  },

  handleFollow: async (id, follow) => {
    if (follow) await followProfile(id)
    else await unfollowProfile(id)
  },

  clear: () => {
    set({
      postsCache: null,
      peopleCache: null,
      mediaCache: null,
      profileMap: new Map(),
      loading: false,
      error: null,
    })
  },
}))
