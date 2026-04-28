import axiosInstance from '@/lib/axiosInstance'

export interface TablaValor {
  id: string
  tabla_id: string
  valor: string
  activo: boolean
  orden: number
}

export const tablaService = {
  listarTablas: async (): Promise<string[]> => {
    const res = await axiosInstance.get<string[]>('/tablas/disponibles')
    return res.data
  },

  listar: async (tablaId: string, soloActivos = false): Promise<TablaValor[]> => {
    const res = await axiosInstance.get<TablaValor[]>(`/tablas/${tablaId}`, { params: { solo_activos: soloActivos } })
    return res.data
  },

  crear: async (tablaId: string, valor: string): Promise<TablaValor> => {
    const res = await axiosInstance.post<TablaValor>(`/tablas/${tablaId}`, { valor })
    return res.data
  },

  actualizar: async (tablaId: string, itemId: string, datos: { valor?: string; activo?: boolean }): Promise<TablaValor> => {
    const res = await axiosInstance.put<TablaValor>(`/tablas/${tablaId}/${itemId}`, datos)
    return res.data
  },

  eliminar: async (tablaId: string, itemId: string): Promise<void> => {
    await axiosInstance.delete(`/tablas/${tablaId}/${itemId}`)
  },

  // Helper para usar en Select de Mantine
  comoOpciones: async (tablaId: string): Promise<{ value: string; label: string }[]> => {
    const items = await tablaService.listar(tablaId, true)
    return items.map((i) => ({ value: i.valor, label: i.valor }))
  },
}
