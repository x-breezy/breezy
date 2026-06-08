import axios from "axios"
import apiClient from "./client"

export interface AuthUser {
  id: string
  username: string
  email: string
  roles: string[]
  isBanned: boolean
  isSuspended: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthData {
  token: string
  user: AuthUser
}

export interface SignInPayload {
  email: string
  password: string
}

export interface SignUpPayload {
  username: string
  email: string
  password: string
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? "Something went wrong."
  }
  return "Something went wrong."
}

export async function signIn(payload: SignInPayload): Promise<AuthData> {
  const { data } = await apiClient.post<{ success: true; data: AuthData }>(
    "/api/auth/sign-in",
    payload
  )
  return data.data
}

export async function signUp(payload: SignUpPayload): Promise<AuthData> {
  const { data } = await apiClient.post<{ success: true; data: AuthData }>(
    "/api/auth/sign-up",
    payload
  )
  return data.data
}
