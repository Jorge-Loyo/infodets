'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/store/sessionStore'
import { useAuthReady } from '@/components/layout/AuthProvider'
import { ROUTES } from '@/lib/constants'

export function useRequireAuth({ adminOnly = false } = {}) {
  const router = useRouter()
  const isReady = useAuthReady()
  const { isAuthenticated, isAdmin } = useSessionStore()
  const [checking, setChecking] = useState(true)
  const redirected = useRef(false)

  useEffect(() => {
    if (!isReady || redirected.current) return

    if (!isAuthenticated()) {
      redirected.current = true
      router.replace(ROUTES.HOME)
      return
    }
    if (adminOnly && !isAdmin()) {
      redirected.current = true
      router.replace(ROUTES.CONSULTA)
      return
    }
    setChecking(false)
  }, [isReady])

  return { checking: !isReady || checking }
}
