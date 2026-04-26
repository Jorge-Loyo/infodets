'use client'

import { useEffect, useState } from 'react'
import { fetchAuthSession } from 'aws-amplify/auth'
import { Hub } from 'aws-amplify/utils'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/store/sessionStore'
import { ROUTES } from '@/lib/constants'

export function useRequireAuth({ adminOnly = false } = {}) {
  const router = useRouter()
  const { isAuthenticated, isAdmin } = useSessionStore()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Si ya hay sesión en memoria, no llamar a Amplify
    if (isAuthenticated()) {
      if (adminOnly && !isAdmin()) router.replace(ROUTES.CONSULTA)
      else setChecking(false)
      return
    }

    const hasCode = window.location.search.includes('code=')

    const verify = async () => {
      try {
        const session = await fetchAuthSession({ forceRefresh: false })
        const token = session.tokens?.accessToken
        if (!token) {
          router.replace(ROUTES.LOGIN)
          return
        }
        if (adminOnly) {
          const rol = (token.payload['custom:rol'] as string) ?? 'operador'
          if (rol !== 'admin') {
            router.replace(ROUTES.CONSULTA)
            return
          }
        }
        setChecking(false)
      } catch {
        router.replace(ROUTES.LOGIN)
      }
    }

    if (hasCode) {
      const unsubscribe = Hub.listen('auth', ({ payload }) => {
        if (payload.event === 'signInWithRedirect') {
          unsubscribe()
          verify()
        }
        if (payload.event === 'signInWithRedirect_failure') {
          unsubscribe()
          router.replace(ROUTES.LOGIN)
        }
      })
      const timeout = setTimeout(() => {
        unsubscribe()
        router.replace(ROUTES.LOGIN)
      }, 10000)
      return () => {
        unsubscribe()
        clearTimeout(timeout)
      }
    } else {
      verify()
    }
  }, [])

  return { checking }
}
