import axiosInstance from '@/lib/axiosInstance'
import axios from 'axios'
import type { IngestaResponse, DocumentoListItem } from '@/types/ingesta.types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/v1'

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

  listarRecientes: async (): Promise<DocumentoListItem[]> => {
    const res = await axios.get<DocumentoListItem[]>(`${API_BASE}/ingesta/recientes`)
    return res.data
  },
}
