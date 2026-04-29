// Espejo de EstadoDocumento (Python Enum)
export type EstadoDocumento = 'pendiente' | 'procesado' | 'error'

// Espejo de IngestaRequest (Python)
export interface IngestaRequest {
  titulo: string
  categoria: string
  dependencia: string
  descripcion?: string
  anio?: number
  subido_por: string
}

// Espejo de IngestaResponse (Python)
export interface IngestaResponse {
  id: string
  titulo: string
  categoria: string
  dependencia: string
  estado: EstadoDocumento
  archivo_url: string
  vector_id?: string
  created_at: string
}

// Espejo de DocumentoListItem (Python)
export interface DocumentoListItem {
  id: string
  titulo: string
  categoria: string
  dependencia: string
  estado: EstadoDocumento
  vector_id?: string
  created_at: string
}
