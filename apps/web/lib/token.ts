const TOKEN_KEY = "breezy-token"

export function setToken(token: string) {
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_KEY}=([^;]*)`))
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

export function removeToken() {
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`
}
