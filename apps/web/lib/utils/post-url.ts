const POST_URL_PATTERN = /\/post\/([^/]+)\/([a-f0-9]{24})/i

export interface ParsedPostUrl {
  username: string
  postId: string
}

export function parsePostUrl(text: string): ParsedPostUrl | null {
  const match = POST_URL_PATTERN.exec(text.trim())
  if (!match) return null
  return { username: match[1]!, postId: match[2]! }
}

export function isPostUrl(text: string): boolean {
  return POST_URL_PATTERN.test(text.trim())
}
