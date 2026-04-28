import axiosInstance from '@/lib/axiosInstance'
import type { IngestaResponse, DocumentoListItem } from '@/types/ingesta.types'

export const ingestaService = {
  cargar: async (archivo: File, metadata: {
    titulo: string
    categoria: string
    dependencia: string
    descripcion?: string
    anio?: number
  }): Promise<IngestaResponse> => {
    const form = new FormData()
    form.append('archivo', archivo)
    form.append('titulo', metadata.titulo)
    form.append('categoria', metadata.categoria)
    form.append('dependencia', metadata.dependencia)
    if (metadata.descripcion) form.append('descripcion', metadata.descripcion)
    if (metadata.anio) form.append('anio', String(metadata.anio))

    const res = await axiosInstance.post<IngestaResponse>('/admin/ingesta', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  listar: async (): Promise<DocumentoListItem[]> => {
    const res = await axiosInstance.get<DocumentoListItem[]>('/admin/ingesta')
    return res.data
  },
}
