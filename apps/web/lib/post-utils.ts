const POST_TOKEN_CLASSES = {
  mention: "text-primary",
  hashtag: "text-primary",
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
      if (token.type === "text") return escapeHtml(token.value).replace(/\n/g, "<br>")
      return `<span class="${POST_TOKEN_CLASSES[token.type]}">${escapeHtml(token.value)}</span>`
    })
    .join("")
}

// Editor variant: plain color only, \n kept as text node chars (works with whitespace-pre-wrap)
export function buildEditorHTML(text: string): string {
  return buildPostTokens(text)
    .map((token) => {
      if (token.type === "text") return escapeHtml(token.value)
      return `<span class="text-primary">${escapeHtml(token.value)}</span>`
    })
    .join("")
}
