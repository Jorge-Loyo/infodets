export interface ConsultaRequest {
  pregunta: string
  usuario_id: string
}

export interface FuenteDocumento {
  nombre: string
  url: string
  pagina?: number
}

export interface ConsultaResponse {
  id: string
  pregunta: string
  respuesta: string
  fuente: FuenteDocumento
  created_at: string
}

export interface HistorialItem {
  id: string
  pregunta: string
  created_at: string
}
