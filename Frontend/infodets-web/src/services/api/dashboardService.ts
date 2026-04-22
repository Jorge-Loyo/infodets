import axiosInstance from '@/lib/axiosInstance'
import type { DashboardStats } from '@/types/dashboard.types'

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await axiosInstance.get<DashboardStats>('/dashboard/stats')
    return res.data
  },
}
