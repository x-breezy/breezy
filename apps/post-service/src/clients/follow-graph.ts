const TIMEOUT_MS = 1500

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export interface FollowGraphPort {
  /**
   * Returns the list of userIds that viewerId follows.
   * Returns null when the source is unavailable or the call fails — callers return an empty feed.
   */
  getFollowing(viewerId: string): Promise<string[] | null>
}

/**
 * Fetches the follow graph from profile-service via HTTP.
 * Expects PROFILE_SERVICE_URL env var (e.g. http://profile-service:3000).
 * Endpoint: GET {PROFILE_SERVICE_URL}/profiles/:id/following
 * Expected response shape: { success: true, data: { count: number, following: string[] } }
 * On missing env var, timeout, non-2xx, or any network error returns null.
 */
export class HttpFollowGraph implements FollowGraphPort {
  private readonly baseUrl: string | undefined

  constructor() {
    this.baseUrl = process.env.PROFILE_SERVICE_URL
  }

  async getFollowing(viewerId: string): Promise<string[] | null> {
    if (!this.baseUrl) return null
    if (!UUID_RE.test(viewerId)) return null

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await fetch(
        `${this.baseUrl}/profiles/${encodeURIComponent(viewerId)}/following`,
        {
          signal: controller.signal,
          headers: {
            "x-user-id": viewerId,
            "x-roles": "user",
          },
        }
      )
      if (!res.ok) return null
      const body = (await res.json()) as { success?: boolean; data?: { following?: string[] } }
      if (Array.isArray(body.data?.following)) return body.data.following
      return null
    } catch {
      return null
    } finally {
      clearTimeout(timer)
    }
  }
}
