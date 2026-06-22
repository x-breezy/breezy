import axios from "axios"
import { cookies } from "next/headers"
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/auth-cookies"

const serverClient = axios.create({
  baseURL: process.env.API_URL ?? "http://localhost",
})

serverClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const cookieStore = await cookies()
      cookieStore.delete(ACCESS_COOKIE)
      cookieStore.delete(REFRESH_COOKIE)
    }
    return Promise.reject(error)
  }
)

export default serverClient
