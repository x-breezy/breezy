const POST_TOKEN_CLASSES = {
  mention: "inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-primary",
  hashtag:
    "inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-secondary-foreground",
} as const

export type PostToken =
  | { type: "text"; value: string }
  | { type: "mention" | "hashtag"; value: string; className: string }

export function buildPostTokens(text: string): PostToken[] {
  const tokens: PostToken[] = []
  const regex = /[@#][a-zA-Z0-9_À-ÿ]+/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) tokens.push({ type: "text", value: text.slice(last, match.index) })
    const type = match[0].startsWith("@") ? "mention" : "hashtag"
    tokens.push({ type, value: match[0], className: POST_TOKEN_CLASSES[type] })
    last = regex.lastIndex
  }

  if (last < text.length) tokens.push({ type: "text", value: text.slice(last) })

  return tokens
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
}

export function buildPostHTML(text: string): string {
  return buildPostTokens(text)
    .map((token) => {
      if (token.type === "text") return escapeHtml(token.value)
      return `<span class="${POST_TOKEN_CLASSES[token.type]}">${escapeHtml(token.value)}</span>`
    })
    .join("")
}
