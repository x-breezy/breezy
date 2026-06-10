import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios"
import {
  getToken,
  setToken,
  removeToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
} from "@/lib/auth/token"

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost"

const apiClient = axios.create({ baseURL })

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On a 401, try a one-shot refresh using the rotating refresh token, then replay.
let refreshing: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null
  try {
    const { data } = await axios.post(`${baseURL}/api/auth/refresh`, { refreshToken })
    const next = data?.data as { token?: string; refreshToken?: string } | undefined
    if (!next?.token) return null
    setToken(next.token)
    if (next.refreshToken) setRefreshToken(next.refreshToken)
    return next.token
  } catch {
    removeToken()
    removeRefreshToken()
    return null
  }
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      refreshing = refreshing ?? refreshAccessToken()
      const token = await refreshing
      refreshing = null
      if (token) {
        original.headers.Authorization = `Bearer ${token}`
        return apiClient(original)
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
