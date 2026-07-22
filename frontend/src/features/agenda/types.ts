export type TipoCompromisso =
  | "audiencia"
  | "pericia"
  | "diligencia"
  | "entrega_laudo"
  | "reuniao"
  | "lembrete"

export interface Compromisso {
  id: number
  titulo: string
  tipo: TipoCompromisso
  data_hora: string
  local: string | null
  concluido: boolean
  observacoes: string | null
  processo: { id: number; numero: string } | null
  responsavel: { id: number; nome: string } | null
}

export const TIPOS_COMPROMISSO: { valor: TipoCompromisso; label: string }[] = [
  { valor: "audiencia", label: "Audiência" },
  { valor: "pericia", label: "Perícia" },
  { valor: "diligencia", label: "Diligência" },
  { valor: "entrega_laudo", label: "Entrega de laudo" },
  { valor: "reuniao", label: "Reunião" },
  { valor: "lembrete", label: "Lembrete" },
]
