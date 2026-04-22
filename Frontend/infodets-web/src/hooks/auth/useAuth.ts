'use client'

import { useSessionStore } from '@/store/sessionStore'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/constants'
import { signOut, fetchUserAttributes, fetchAuthSession } from 'aws-amplify/auth'
import { useEffect } from 'react'

export function useAuth() {
  const { usuario, token, setSession, clearSession, isAuthenticated, isAdmin } = useSessionStore()
  const router = useRouter()

  useEffect(() => {
    const cargarSesion = async () => {
      try {
        const session = await fetchAuthSession()
        const attrs = await fetchUserAttributes()
        const accessToken = session.tokens?.accessToken?.toString()

        if (accessToken && attrs.email) {
          setSession(
            {
              id: attrs.sub ?? '',
              nombre: attrs.name ?? attrs.email,
              apellido: '',
              email: attrs.email,
              rol: (attrs['custom:rol'] as 'admin' | 'operador') ?? 'operador',
            },
            accessToken
          )
        }
      } catch {
        clearSession()
      }
    }

    if (!isAuthenticated()) cargarSesion()
  }, [])

  const logout = async () => {
    await signOut()
    clearSession()
    router.push(ROUTES.LOGIN)
  }

  return { usuario, token, setSession, logout, isAuthenticated, isAdmin }
}
