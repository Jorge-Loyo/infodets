// Espejo de FeedbackTipo (Python Enum)
export type FeedbackTipo = 'correcto' | 'incorrecto'

// Espejo de FeedbackRequest (Python)
export interface FeedbackRequest {
  consulta_id: string
  usuario_id: string
  tipo: FeedbackTipo
  comentario?: string
}

// Espejo de FeedbackResponse (Python)
export interface FeedbackResponse {
  id: string
  consulta_id: string
  usuario_id: string
  tipo: FeedbackTipo
  comentario?: string
  created_at: string
}
