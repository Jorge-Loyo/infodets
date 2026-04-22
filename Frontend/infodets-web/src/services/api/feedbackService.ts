import axiosInstance from '@/lib/axiosInstance'
import type { FeedbackRequest, FeedbackResponse } from '@/types/feedback.types'

export const feedbackService = {
  enviar: async (data: FeedbackRequest): Promise<FeedbackResponse> => {
    const res = await axiosInstance.post<FeedbackResponse>('/feedback', data)
    return res.data
  },

  getAll: async (): Promise<FeedbackResponse[]> => {
    const res = await axiosInstance.get<FeedbackResponse[]>('/feedback')
    return res.data
  },
}
