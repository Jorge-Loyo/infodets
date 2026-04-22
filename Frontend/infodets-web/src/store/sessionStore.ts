import { create } from 'zustand'
import { ROLES } from '@/lib/constants'

type Rol = (typeof ROLES)[keyof typeof ROLES]

interface Usuario {
  id: string
  nombre: string
  email: string
  rol: Rol
}

interface SessionStore {
  usuario: Usuario | null
  token: string | null
  setSession: (usuario: Usuario, token: string) => void
  clearSession: () => void
  isAuthenticated: () => boolean
  isAdmin: () => boolean
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  usuario: null,
  token: null,
  setSession: (usuario, token) => set({ usuario, token }),
  clearSession: () => set({ usuario: null, token: null }),
  isAuthenticated: () => !!get().token,
  isAdmin: () => get().usuario?.rol === ROLES.ADMIN,
}))
