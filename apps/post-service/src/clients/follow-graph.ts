const TIMEOUT_MS = 1500

export interface FollowGraphPort {
  /**
   * Returns the list of userIds that viewerId follows.
   * Returns null when the source is unavailable or the call fails — callers must fall back
   * to a global (unfiltered) feed rather than erroring.
   */
  getFollowing(viewerId: string): Promise<string[] | null>
}

/**
 * Fetches the follow graph from user-service via HTTP.
 * Expects USER_SERVICE_URL env var (e.g. http://user-service:3000).
 * Endpoint: GET {USER_SERVICE_URL}/users/:id/following
 * Expected response shape: { data: string[] } or string[] directly.
 * On missing env var, timeout, non-2xx, or any network error returns null.
 */
export class HttpFollowGraph implements FollowGraphPort {
  private readonly baseUrl: string | undefined

  constructor() {
    this.baseUrl = process.env.USER_SERVICE_URL
  }

  async getFollowing(viewerId: string): Promise<string[] | null> {
    if (!this.baseUrl) return null

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const res = await fetch(`${this.baseUrl}/users/${viewerId}/following`, {
        signal: controller.signal,
      })
      if (!res.ok) return null
      const body = (await res.json()) as { data?: string[] } | string[]
      if (Array.isArray(body)) return body
      if (Array.isArray(body.data)) return body.data
      return null
    } catch {
      return null
    } finally {
      clearTimeout(timer)
    }
  }
}

/**
 * Null implementation — always returns null, triggering global chronological feed.
 * Used as default when user-service is not wired (dev/test without USER_SERVICE_URL).
 */
export class NullFollowGraph implements FollowGraphPort {
  async getFollowing(_viewerId: string): Promise<string[] | null> {
    return null
  }
}
