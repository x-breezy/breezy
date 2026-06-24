import serverClient from "@/lib/api/server-client"

export function signUp(username: string, email: string, password: string) {
  return serverClient.post("/api/auth/sign-up", { username, email, password })
}

export function signIn(identifier: string, password: string) {
  return serverClient.post("/api/auth/sign-in", { identifier, password })
}

export function logout(refreshToken: string) {
  return serverClient.post("/api/auth/logout", { refreshToken })
}

export function forgotPassword(email: string) {
  return serverClient.post("/api/auth/forgot-password", { email })
}

export function verifyEmail(token: string) {
  return serverClient.post("/api/auth/verify-email", { token })
}

export function resetPassword(token: string, password: string) {
  return serverClient.post("/api/auth/reset-password", { token, password })
}

export function resendVerificationEmail(email: string) {
  return serverClient.post("/api/auth/resend-verification", { email })
}

export function verifyTwoFactorLogin(pendingToken: string, code: string) {
  return serverClient.post("/api/auth/2fa/verify-login", { pendingToken, code })
}

export function resendTwoFactorLoginCode(pendingToken: string) {
  return serverClient.post("/api/auth/2fa/resend-login-code", { pendingToken })
}

export function sendTwoFactorCode(authHeader: Record<string, string>) {
  return serverClient.post("/api/auth/2fa/send-code", null, { headers: authHeader })
}

export function enableTwoFactor(code: string, authHeader: Record<string, string>) {
  return serverClient.post("/api/auth/2fa/enable", { code }, { headers: authHeader })
}

export function disableTwoFactor(authHeader: Record<string, string>) {
  return serverClient.post("/api/auth/2fa/disable", null, { headers: authHeader })
}

export function getMe(authHeader: Record<string, string>) {
  return serverClient.get("/api/users/me", { headers: authHeader })
}

export function googleAuth(code: string, codeVerifier: string, redirectUri: string) {
  return serverClient.post("/api/auth/google", { code, codeVerifier, redirectUri })
}

export function completeGoogleAuth(pendingToken: string, username: string) {
  return serverClient.post("/api/auth/google/complete", { pendingToken, username })
}

export function notifyProfileCreated(refreshToken: string) {
  return serverClient.post("/api/auth/profile-created", { refreshToken })
}

export function getUserById(id: string, authHeader: Record<string, string>) {
  return serverClient.get(`/api/users/${id}`, { headers: authHeader })
}
