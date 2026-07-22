export interface LogAuditoria {
  id: number
  metodo: string
  caminho: string
  status_code: number
  ip: string | null
  usuario: { id: number; nome: string } | null
  criado_em: string
}
