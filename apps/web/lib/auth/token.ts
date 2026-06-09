import { ACCESS_COOKIE, REFRESH_COOKIE } from "./auth-cookies"

const MAX_AGE = 60 * 60 * 24 * 7

function readCookie(key: string): string | null {
  if (typeof window === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`))
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

export function setToken(token: string) {
  document.cookie = `${ACCESS_COOKIE}=${token}; path=/; max-age=${MAX_AGE}; SameSite=Lax`
}

export function getToken(): string | null {
  return readCookie(ACCESS_COOKIE)
}

export function removeToken() {
  document.cookie = `${ACCESS_COOKIE}=; path=/; max-age=0`
}

export function setRefreshToken(token: string) {
  document.cookie = `${REFRESH_COOKIE}=${token}; path=/; max-age=${MAX_AGE}; SameSite=Lax`
}

export function getRefreshToken(): string | null {
  return readCookie(REFRESH_COOKIE)
}

export function removeRefreshToken() {
  document.cookie = `${REFRESH_COOKIE}=; path=/; max-age=0`
}
