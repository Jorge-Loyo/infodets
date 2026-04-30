import axios from 'axios'
import { useSessionStore } from '@/store/sessionStore'

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

axiosInstance.interceptors.request.use((config) => {
  const token = useSessionStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginEndpoint = error.config?.url?.includes('/auth/login')
    if (error.response?.status === 401 && !isLoginEndpoint) {
      useSessionStore.getState().clearSession()
      if (typeof window !== 'undefined') window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
