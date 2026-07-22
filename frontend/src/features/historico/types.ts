export interface HistoricoAlteracao {
  id: number
  campo: string
  valor_anterior: string | null
  valor_novo: string | null
  usuario: { id: number; nome: string } | null
  criado_em: string
}

export const LABELS_CAMPO: Record<string, string> = {
  situacao: "Situação",
  status: "Status",
  numero: "Número",
  nome: "Nome",
  titulo: "Título",
  especialidade: "Especialidade",
  prazo: "Prazo",
  partes: "Partes",
  objeto: "Objeto",
  observacoes: "Observações",
  comarca_id: "Comarca",
  magistrado_id: "Magistrado",
  cliente_id: "Cliente",
  modelo_id: "Modelo",
  responsavel_id: "Responsável",
  ativo: "Ativo",
  perfil_id: "Perfil",
  email: "E-mail",
  telefone: "Telefone",
  valor: "Valor",
  vencimento: "Vencimento",
  pago_em: "Pago em",
  descricao: "Descrição",
  tipo: "Tipo",
  categoria: "Categoria",
  local: "Local",
  data_hora: "Data/hora",
  concluido: "Concluído",
  estagio: "Estágio",
  origem: "Origem",
  contato: "Contato",
  uf: "UF",
  tribunal: "Tribunal",
  cargo: "Cargo",
  vara: "Vara",
  documento: "Documento",
}

export function labelCampo(campo: string): string {
  return LABELS_CAMPO[campo] ?? campo.replace(/_/g, " ")
}
