import axios from "axios"
import { authStorage } from "@/lib/auth-storage"

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1",
})

api.interceptors.request.use((config) => {
  const token = authStorage.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshing: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = authStorage.getRefreshToken()
  if (!refreshToken) return null

  const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
    refresh_token: refreshToken,
  })
  authStorage.setTokens(data.access_token, data.refresh_token)
  return data.access_token as string
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        refreshing ??= refreshAccessToken()
        const newToken = await refreshing
        refreshing = null
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        }
      } catch {
        refreshing = null
      }
      authStorage.clear()
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)
