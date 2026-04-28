import axiosInstance from '@/lib/axiosInstance'

export const permisoService = {
  obtener: async (usuarioId: string): Promise<Record<string, boolean>> => {
    const res = await axiosInstance.get<Record<string, boolean>>(`/permisos/${usuarioId}`)
    return res.data
  },

  actualizar: async (usuarioId: string, permisos: Record<string, boolean>): Promise<Record<string, boolean>> => {
    const res = await axiosInstance.put<Record<string, boolean>>(`/permisos/${usuarioId}`, { permisos })
    return res.data
  },
}
