export type RolUsuario = 'admin' | 'operador'

export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: RolUsuario
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  usuario: Usuario
  token: string
}
