import axiosInstance from '@/lib/axiosInstance'

export interface Noticia {
  id: string
  titulo: string
  contenido: string
  categoria?: string
  imagen_url?: string
  autor_nombre?: string
  autor_cargo?: string
  publicada: boolean
  likes: number
  creado_en: string
  actualizado_en: string
}

export const noticiaService = {
  listar: async (soloPublicadas = false): Promise<Noticia[]> => {
    const res = await axiosInstance.get<Noticia[]>('/noticias', { params: { solo_publicadas: soloPublicadas } })
    return res.data
  },

  crear: async (datos: FormData): Promise<Noticia> => {
    const res = await axiosInstance.post<Noticia>('/noticias', datos, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  actualizar: async (id: string, datos: FormData): Promise<Noticia> => {
    const res = await axiosInstance.put<Noticia>(`/noticias/${id}`, datos, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  eliminar: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/noticias/${id}`)
  },

  like: async (id: string, sumar: boolean): Promise<Noticia> => {
    const res = await axiosInstance.post<Noticia>(`/noticias/${id}/like`, null, { params: { sumar } })
    return res.data
  },
}
