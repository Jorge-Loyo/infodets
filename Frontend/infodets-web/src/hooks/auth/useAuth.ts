'use client'

import { useSessionStore } from '@/store/sessionStore'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/constants'

export function useAuth() {
  const { usuario, token, setSession, clearSession, isAuthenticated, isAdmin } = useSessionStore()
  const router = useRouter()

  const logout = () => {
    clearSession()
    localStorage.removeItem('infodets_token')
    router.push(ROUTES.LOGIN)
  }

  return { usuario, token, setSession, logout, isAuthenticated, isAdmin }
}
