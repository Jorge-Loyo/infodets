import { create } from 'zustand'
import { ROLES } from '@/lib/constants'

type Rol = (typeof ROLES)[keyof typeof ROLES]

interface Usuario {
  id: string
  nombre: string
  apellido: string
  email: string
  rol: Rol
  dni?: string
  cargo?: string
  institucion?: string
  dependencia?: string
  fecha_nacimiento?: string
}

interface SessionStore {
  usuario: Usuario | null
  token: string | null
  setSession: (usuario: Usuario, token: string) => void
  updatePerfil: (datos: Partial<Usuario>) => void
  clearSession: () => void
  isAuthenticated: () => boolean
  isAdmin: () => boolean
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  usuario: null,
  token: null,
  setSession: (usuario, token) => set({ usuario, token }),
  updatePerfil: (datos) => set((state) => ({
    usuario: state.usuario ? { ...state.usuario, ...datos } : null,
  })),
  clearSession: () => set({ usuario: null, token: null }),
  isAuthenticated: () => !!get().token,
  isAdmin: () => get().usuario?.rol === ROLES.ADMIN,
}))
