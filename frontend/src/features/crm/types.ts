export interface Comarca {
  id: number
  nome: string
  uf: string
  tribunal: string | null
}

export interface Magistrado {
  id: number
  nome: string
  cargo: string | null
  vara: string | null
  email: string | null
  telefone: string | null
  observacoes: string | null
  comarca: Comarca
}

export interface Escritorio {
  id: number
  nome: string
  cnpj: string | null
  email: string | null
  telefone: string | null
  cidade: string | null
  uf: string | null
  observacoes: string | null
}

export interface Advogado {
  id: number
  nome: string
  oab: string | null
  email: string | null
  telefone: string | null
  observacoes: string | null
  escritorio: Escritorio | null
}

export interface Contato {
  id: number
  nome: string
  cargo: string | null
  organizacao: string | null
  email: string | null
  telefone: string | null
  observacoes: string | null
}

export type TipoPessoa = "pessoa_fisica" | "pessoa_juridica"

export interface Cliente {
  id: number
  nome: string
  tipo: TipoPessoa
  documento: string | null
  email: string | null
  telefone: string | null
  observacoes: string | null
}

export type EstagioProspeccao = "prospeccao" | "contato" | "resposta" | "nomeacao" | "perdida"

export interface Prospeccao {
  id: number
  nome: string
  estagio: EstagioProspeccao
  origem: string | null
  contato: string | null
  observacoes: string | null
  cliente: Cliente | null
  responsavel: { id: number; nome: string } | null
}

export const ESTAGIOS_PROSPECCAO: { valor: EstagioProspeccao; label: string }[] = [
  { valor: "prospeccao", label: "Prospecção" },
  { valor: "contato", label: "Contato" },
  { valor: "resposta", label: "Resposta" },
  { valor: "nomeacao", label: "Nomeação" },
  { valor: "perdida", label: "Perdida" },
]
