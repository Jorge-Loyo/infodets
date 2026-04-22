export type RolUsuario = 'admin' | 'operador'

export interface Usuario {
  id: string
  nombre: string
  apellido: string
  email: string
  rol: RolUsuario
  dni?: string
  cargo?: string
  institucion?: string
  dependencia?: string
  fecha_nacimiento?: string
}

export interface PerfilForm {
  nombre: string
  apellido: string
  dni: string
  cargo: string
  institucion: string
  dependencia: string
  fecha_nacimiento: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  usuario: Usuario
  token: string
}
