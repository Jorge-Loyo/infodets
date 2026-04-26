// Espejo de ChatRequest (Python)
export interface ChatRequest {
  mensaje: string
  usuario_id: string
  institucion?: string
  dependencia?: string
}

// Espejo de FuenteDocumento (Python)
export interface FuenteDocumento {
  nombre: string
  url: string
  pagina?: number
  categoria?: string
}

// Espejo de ChatChunkEvent (Python)
export interface ChatChunkEvent {
  tipo: 'chunk'
  texto: string
}

// Espejo de ChatFinalEvent (Python)
export interface ChatFinalEvent {
  tipo: 'final'
  consulta_id: string
  fuentes: FuenteDocumento[]
  confianza: number
  tipo_respuesta: 'local' | 'fallback' | 'sin_respuesta'
}

// Espejo de ChatErrorEvent (Python)
export interface ChatErrorEvent {
  tipo: 'error'
  mensaje: string
}

export type ChatStreamEvent = ChatChunkEvent | ChatFinalEvent | ChatErrorEvent

// Historial
export interface HistorialItem {
  id: string
  pregunta: string
  created_at: string
}
