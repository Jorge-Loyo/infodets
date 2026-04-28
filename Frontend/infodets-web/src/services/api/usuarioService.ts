import axiosInstance from '@/lib/axiosInstance'

export interface Usuario {
  id: string
  cognito_sub?: string
  email: string
  nombre?: string
  apellido?: string
  dni?: string
  fecha_nacimiento?: string
  cargo?: string
  institucion?: string
  dependencia?: string
  rol: 'admin' | 'operador' | 'visor'
  perfil_id?: string
}

export interface UsuarioActualizar {
  nombre?: string
  apellido?: string
  email?: string
  dni?: string
  fecha_nacimiento?: string
  cargo?: string
  institucion?: string
  dependencia?: string
  rol?: string
}

export const usuarioService = {
  cargarPerfil: async (): Promise<Usuario> => {
    const res = await axiosInstance.get<Usuario>('/usuarios/me')
    return res.data
  },

  actualizarMiPerfil: async (datos: UsuarioActualizar): Promise<Usuario> => {
    const res = await axiosInstance.put<Usuario>('/usuarios/me', datos)
    return res.data
  },

  listar: async (): Promise<Usuario[]> => {
    const res = await axiosInstance.get<Usuario[]>('/usuarios')
    return res.data
  },

  actualizar: async (id: string, datos: UsuarioActualizar): Promise<Usuario> => {
    const res = await axiosInstance.put<Usuario>(`/usuarios/${id}`, datos)
    return res.data
  },

  eliminar: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/usuarios/${id}`)
  },
}
