export interface AuthActionError {
  error: string
  code?: string
  retryAfter?: number
}

interface ErrorBody {
  message?: unknown
  code?: unknown
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined

  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds > 0) return Math.ceil(seconds)

  const retryAt = Date.parse(value)
  if (Number.isNaN(retryAt)) return undefined

  const secondsUntilRetry = Math.ceil((retryAt - Date.now()) / 1000)
  return secondsUntilRetry > 0 ? secondsUntilRetry : undefined
}

export async function getAuthActionError(
  response: Response,
  fallback: string
): Promise<AuthActionError> {
  let body: ErrorBody | null = null

  try {
    body = (await response.json()) as ErrorBody
  } catch {
    body = null
  }

  const code = typeof body?.code === "string" ? body.code : undefined
  const retryAfter =
    parseRetryAfter(response.headers.get("Retry-After")) ??
    (response.status === 429 || code === "EMAIL_SEND_RATE_LIMITED" ? 60 : undefined)

  return {
    error: typeof body?.message === "string" ? body.message : fallback,
    code,
    retryAfter,
  }
}
