'use client'

import { useSessionStore } from '@/store/sessionStore'
import { fetchAuthSession, signOut } from 'aws-amplify/auth'
import { useEffect } from 'react'
import axiosInstance from '@/lib/axiosInstance'

export function useAuth() {
  const { usuario, token, setSession, clearSession, isAuthenticated, isAdmin } = useSessionStore()

  useEffect(() => {
    const cargarSesion = async () => {
      try {
        const session = await fetchAuthSession({ forceRefresh: true })
        const accessToken = session.tokens?.accessToken
        const idToken = session.tokens?.idToken
        if (!accessToken || !idToken) {
          clearSession()
          return
        }
        const payload = idToken.payload
        const groups = (payload['cognito:groups'] as string[]) ?? []
        const rol: 'admin' | 'operador' = groups.includes('admin') ? 'admin' : 'operador'

        // Obtener el id de RDS y datos del perfil desde el backend
        let rdsId: string | undefined
        let cargo: string | undefined
        let nombre_rds: string | undefined
        try {
          const res = await axiosInstance.get('/usuarios/me')
          rdsId = res.data.id
          cargo = res.data.cargo
          nombre_rds = res.data.nombre
        } catch {}

        setSession(
          {
            id: (payload['sub'] as string) ?? '',
            rdsId,
            nombre: nombre_rds ?? (payload['name'] as string) ?? (payload['email'] as string) ?? '',
            apellido: '',
            email: (payload['email'] as string) ?? '',
            rol,
            cargo,
          },
          accessToken.toString()
        )
      } catch (e) {
        console.error('[useAuth] ERROR:', e)
        clearSession()
      }
    }

    cargarSesion()
  }, [])

  const logout = async () => {
    clearSession()
    await signOut()
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
    const domain = (process.env.NEXT_PUBLIC_COGNITO_DOMAIN ?? '').replace(/\/$/, '')
    const redirectUri = encodeURIComponent(process.env.NEXT_PUBLIC_REDIRECT_SIGN_OUT ?? 'http://localhost:3000/login')
    Object.keys(localStorage)
      .filter((k) => k.startsWith('CognitoIdentityServiceProvider') || k.startsWith('amplify-'))
      .forEach((k) => localStorage.removeItem(k))
    window.location.href = `https://${domain}/logout?client_id=${clientId}&logout_uri=${redirectUri}`
  }

  return { usuario, token, setSession, logout, isAuthenticated, isAdmin }
}
