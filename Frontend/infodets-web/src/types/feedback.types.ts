export type FeedbackTipo = 'correcto' | 'incorrecto'

export interface FeedbackRequest {
  consulta_id: string
  tipo: FeedbackTipo
  comentario?: string
}

export interface FeedbackResponse {
  id: string
  consulta_id: string
  tipo: FeedbackTipo
  comentario?: string
  created_at: string
}
