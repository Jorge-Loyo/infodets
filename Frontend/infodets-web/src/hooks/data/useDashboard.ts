'use client'

import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/services/api/dashboardService'
import { QUERY_KEYS } from '@/lib/constants'

export function useDashboard() {
  return useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD],
    queryFn: dashboardService.getStats,
  })
}
