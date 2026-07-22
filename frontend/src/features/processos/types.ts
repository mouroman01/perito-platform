import type { Cliente, Comarca, Magistrado } from "@/features/crm/types"

export type SituacaoProcesso =
  | "aceite"
  | "analise"
  | "coleta"
  | "pericia"
  | "laudo"
  | "entrega"
  | "arquivado"

export interface Processo {
  id: number
  numero: string
  partes: string | null
  objeto: string | null
  especialidade: string | null
  prazo: string | null
  situacao: SituacaoProcesso
  observacoes: string | null
  comarca: Comarca
  magistrado: Magistrado | null
  cliente: Cliente | null
}

export const SITUACOES_PROCESSO: { valor: SituacaoProcesso; label: string }[] = [
  { valor: "aceite", label: "Aceite" },
  { valor: "analise", label: "Análise" },
  { valor: "coleta", label: "Coleta" },
  { valor: "pericia", label: "Perícia" },
  { valor: "laudo", label: "Laudo" },
  { valor: "entrega", label: "Entrega" },
  { valor: "arquivado", label: "Arquivado" },
]

export interface Documento {
  id: number
  nome_original: string
  categoria: string | null
  tamanho_bytes: number
  content_type: string | null
  processo_id: number
  enviado_por: { id: number; nome: string } | null
  criado_em: string
}

export type TipoEvidencia =
  | "foto"
  | "video"
  | "audio"
  | "pdf"
  | "word"
  | "planilha"
  | "log"
  | "outro"

export type MidiaOrigemEvidencia = "hd" | "ssd" | "pendrive" | "outro"

export interface Evidencia {
  id: number
  nome_original: string
  tipo: TipoEvidencia
  midia_origem: MidiaOrigemEvidencia | null
  descricao: string | null
  hash_sha256: string
  tamanho_bytes: number
  content_type: string | null
  processo_id: number
  responsavel: { id: number; nome: string } | null
  criado_em: string
}

export const TIPOS_EVIDENCIA: { valor: TipoEvidencia; label: string }[] = [
  { valor: "foto", label: "Foto" },
  { valor: "video", label: "Vídeo" },
  { valor: "audio", label: "Áudio" },
  { valor: "pdf", label: "PDF" },
  { valor: "word", label: "Word" },
  { valor: "planilha", label: "Planilha" },
  { valor: "log", label: "Log" },
  { valor: "outro", label: "Outro" },
]

export const MIDIAS_ORIGEM_EVIDENCIA: { valor: MidiaOrigemEvidencia; label: string }[] = [
  { valor: "hd", label: "HD" },
  { valor: "ssd", label: "SSD" },
  { valor: "pendrive", label: "Pendrive" },
  { valor: "outro", label: "Outro" },
]
