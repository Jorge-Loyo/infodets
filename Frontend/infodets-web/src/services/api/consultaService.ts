import axiosInstance from '@/lib/axiosInstance'
import type { ConsultaRequest, ConsultaResponse, HistorialItem } from '@/types/consulta.types'

export const consultaService = {
  enviar: async (data: ConsultaRequest): Promise<ConsultaResponse> => {
    const res = await axiosInstance.post<ConsultaResponse>('/consultas', data)
    return res.data
  },

  getHistorial: async (usuarioId: string): Promise<HistorialItem[]> => {
    const res = await axiosInstance.get<HistorialItem[]>(`/consultas/historial/${usuarioId}`)
    return res.data
  },
}
