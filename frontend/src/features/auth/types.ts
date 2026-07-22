export interface Perfil {
  id: number
  nome: string
  descricao: string | null
  permissoes: string[]
}

export interface Usuario {
  id: number
  nome: string
  email: string
  ativo: boolean
  perfil: Perfil
  ultimo_login_em: string | null
  criado_em: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  usuario: Usuario
}
