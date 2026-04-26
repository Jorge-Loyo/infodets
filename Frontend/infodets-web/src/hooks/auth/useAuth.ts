'use client'

import { useSessionStore } from '@/store/sessionStore'
import { ROUTES } from '@/lib/constants'
import { fetchUserAttributes, fetchAuthSession, signOut } from 'aws-amplify/auth'
import { useEffect } from 'react'

export function useAuth() {
  const { usuario, token, setSession, clearSession, isAuthenticated, isAdmin } = useSessionStore()

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
    clearSession()
    await signOut()
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
    const domain = (process.env.NEXT_PUBLIC_COGNITO_DOMAIN ?? '').replace(/\/$/, '')
    const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_REDIRECT_SIGN_OUT ?? 'http://localhost:3000')
    Object.keys(localStorage)
      .filter((k) => k.startsWith('CognitoIdentityServiceProvider') || k.startsWith('amplify-'))
      .forEach((k) => localStorage.removeItem(k))
    window.location.href = `https://${domain}/logout?client_id=${clientId}&logout_uri=${redirectUri}`
  }

  return { usuario, token, setSession, logout, isAuthenticated, isAdmin }
}
