export type {
  SearchPostMedia,
  CreatePostInput,
  SearchPost,
  PaginatedResult,
  TrendingTag,
} from "@/lib/actions/posts"
export {
  createPost,
  searchPosts,
  getLikedPostIds,
  toggleLike,
  getTrendingTags,
} from "@/lib/actions/posts"
