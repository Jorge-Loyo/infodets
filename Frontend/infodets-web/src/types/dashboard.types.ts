export interface HotTopic {
  tema: string
  cantidad: number
}

export interface ConsultasPorDia {
  fecha: string
  cantidad: number
}

export interface DashboardStats {
  total_consultas: number
  total_feedback_incorrecto: number
  hot_topics: HotTopic[]
  consultas_por_dia: ConsultasPorDia[]
}
