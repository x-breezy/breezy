const PROFILE_URL_PATTERN = /\/profile\/([^/?\s]+)/i

export interface ParsedProfileUrl {
  username: string
}

export function parseProfileUrl(text: string): ParsedProfileUrl | null {
  const match = PROFILE_URL_PATTERN.exec(text.trim())
  if (!match) return null
  return { username: match[1]! }
}

export function isProfileUrl(text: string): boolean {
  return PROFILE_URL_PATTERN.test(text.trim())
}
