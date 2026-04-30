import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ROLES } from '@/lib/constants'

type Rol = (typeof ROLES)[keyof typeof ROLES]

interface Usuario {
  id: string
  rdsId?: string
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
  permisos: Record<string, boolean>
  isReady: boolean
  setSession: (usuario: Usuario, token: string, permisos?: Record<string, boolean>) => void
  setPermisos: (permisos: Record<string, boolean>) => void
  setReady: (ready: boolean) => void
  updatePerfil: (datos: Partial<Usuario>) => void
  clearSession: () => void
  isAuthenticated: () => boolean
  isAdmin: () => boolean
  tienePermiso: (key: string) => boolean
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      usuario: null,
      token: null,
      permisos: {},
      isReady: false,
      setSession: (usuario, token, permisos = {}) => set({ usuario, token, permisos }),
      setPermisos: (permisos) => set({ permisos }),
      setReady: (ready) => set({ isReady: ready }),
      updatePerfil: (datos) => set((state) => ({
        usuario: state.usuario ? { ...state.usuario, ...datos } : null,
      })),
      clearSession: () => set({ usuario: null, token: null, permisos: {}, isReady: false }),
      isAuthenticated: () => !!get().token,
      isAdmin: () => get().usuario?.rol === ROLES.ADMIN,
      tienePermiso: (key: string) => get().permisos[key] !== false,
    }),
    {
      name: 'infodets-session',
      partialize: (state) => ({ usuario: state.usuario, token: state.token, permisos: state.permisos }),
    }
  )
)
