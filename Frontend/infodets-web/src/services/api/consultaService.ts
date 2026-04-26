import axiosInstance from '@/lib/axiosInstance'
import type { ChatRequest, ChatStreamEvent, HistorialItem } from '@/types/consulta.types'

export const consultaService = {
  stream: (data: ChatRequest, onChunk: (event: ChatStreamEvent) => void): EventSource => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/chat/stream`
    const source = new EventSource(url)
    source.onmessage = (e) => {
      const event: ChatStreamEvent = JSON.parse(e.data)
      onChunk(event)
      if (event.tipo === 'final' || event.tipo === 'error') source.close()
    }
    return source
  },

  getHistorial: async (usuarioId: string): Promise<HistorialItem[]> => {
    const res = await axiosInstance.get<HistorialItem[]>(`/consultas/historial/${usuarioId}`)
    return res.data
  },
}
