import { API_URL } from "@/lib/auth/session"

const JSON_HEADERS = { "Content-Type": "application/json" }

export function signUp(username: string, email: string, password: string) {
  return fetch(`${API_URL}/api/auth/sign-up`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ username, email, password }),
  })
}

export function signIn(identifier: string, password: string) {
  return fetch(`${API_URL}/api/auth/sign-in`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ identifier, password }),
  })
}

export function logout(refreshToken: string) {
  return fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ refreshToken }),
  })
}

export function forgotPassword(email: string) {
  return fetch(`${API_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ email }),
  })
}

export function verifyEmail(token: string) {
  return fetch(`${API_URL}/api/auth/verify-email`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ token }),
  })
}

export function resendVerificationEmail(email: string) {
  return fetch(`${API_URL}/api/auth/resend-verification`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ email }),
  })
}

export function verifyTwoFactorLogin(pendingToken: string, code: string) {
  return fetch(`${API_URL}/api/auth/2fa/verify-login`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ pendingToken, code }),
  })
}

export function resendTwoFactorLoginCode(pendingToken: string) {
  return fetch(`${API_URL}/api/auth/2fa/resend-login-code`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ pendingToken }),
  })
}

export function sendTwoFactorCode(authHeader: Record<string, string>) {
  return fetch(`${API_URL}/api/auth/2fa/send-code`, {
    method: "POST",
    headers: { ...JSON_HEADERS, ...authHeader },
  })
}

export function enableTwoFactor(code: string, authHeader: Record<string, string>) {
  return fetch(`${API_URL}/api/auth/2fa/enable`, {
    method: "POST",
    headers: { ...JSON_HEADERS, ...authHeader },
    body: JSON.stringify({ code }),
  })
}

export function disableTwoFactor(authHeader: Record<string, string>) {
  return fetch(`${API_URL}/api/auth/2fa/disable`, {
    method: "POST",
    headers: { ...JSON_HEADERS, ...authHeader },
  })
}
