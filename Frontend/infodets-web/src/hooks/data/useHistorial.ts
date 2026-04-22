'use client'

import { useQuery } from '@tanstack/react-query'
import { consultaService } from '@/services/api/consultaService'
import { QUERY_KEYS } from '@/lib/constants'

export function useHistorial(usuarioId: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.HISTORIAL, usuarioId],
    queryFn: () => consultaService.getHistorial(usuarioId),
    enabled: !!usuarioId,
  })
}
