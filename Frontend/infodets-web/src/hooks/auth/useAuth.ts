'use client'

import { useSessionStore } from '@/store/sessionStore'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/constants'

export function useAuth() {
  const { usuario, token, isReady, setSession, clearSession, isAuthenticated, isAdmin } = useSessionStore()
  const router = useRouter()

  const logout = () => {
    clearSession()
    router.replace(ROUTES.HOME)
  }

  return { usuario, token, isReady, setSession, logout, isAuthenticated, isAdmin }
}
