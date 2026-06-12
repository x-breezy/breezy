export type { SearchPost, SearchPostMedia, PaginatedResult, TrendingTag } from "./posts"
export { searchPosts, getLikedPostIds, toggleLike, getTrendingTags } from "./posts"

export type { SearchProfile } from "./profiles"
export { searchProfiles, fetchProfilesByIds, followProfile, unfollowProfile } from "./profiles"
