// Espejo de HotTopic (Python)
export interface HotTopic {
  tema: string
  cantidad: number
  porcentaje: number
}

// Espejo de ConsultasPorDia (Python)
export interface ConsultasPorDia {
  fecha: string
  cantidad: number
}

// Espejo de DashboardStats (Python)
export interface DashboardStats {
  total_consultas: number
  total_feedback_incorrecto: number
  total_documentos: number
  consultas_sin_respuesta: number
  hot_topics: HotTopic[]
  consultas_por_dia: ConsultasPorDia[]
}
