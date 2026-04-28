import axiosInstance from '@/lib/axiosInstance'

export interface Perfil {
  id: string
  nombre: string
  descripcion?: string
  color: string
  rol?: string
  permisos: Record<string, boolean>
  total_usuarios: number
}

export interface PerfilCrear {
  nombre: string
  descripcion?: string
  color: string
  rol?: string
  permisos: Record<string, boolean>
}

export const perfilService = {
  listar: async (): Promise<Perfil[]> => {
    const res = await axiosInstance.get<Perfil[]>('/perfiles')
    return res.data
  },

  crear: async (datos: PerfilCrear): Promise<Perfil> => {
    const res = await axiosInstance.post<Perfil>('/perfiles', datos)
    return res.data
  },

  actualizar: async (id: string, datos: Partial<PerfilCrear>): Promise<Perfil> => {
    const res = await axiosInstance.put<Perfil>(`/perfiles/${id}`, datos)
    return res.data
  },

  eliminar: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/perfiles/${id}`)
  },

  asignarAUsuario: async (usuarioId: string, perfilId: string | null): Promise<void> => {
    await axiosInstance.post(`/perfiles/asignar/${usuarioId}`, { perfil_id: perfilId })
  },
}
