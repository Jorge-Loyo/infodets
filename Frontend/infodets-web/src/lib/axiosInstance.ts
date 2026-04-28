import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      const session = localStorage.getItem('infodets-session')
      if (session) {
        const parsed = JSON.parse(session)
        const token = parsed?.state?.token
        if (token) config.headers.Authorization = `Bearer ${token}`
      }
    } catch {
      // falla silenciosamente
    }
  }
  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
