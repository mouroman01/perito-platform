export type StatusLaudo = "rascunho" | "em_revisao" | "finalizado" | "entregue"

export interface Laudo {
  id: number
  titulo: string
  conteudo: string
  status: StatusLaudo
  processo: { id: number; numero: string }
  modelo: { id: number; nome: string } | null
  criado_por: { id: number; nome: string } | null
}

export const STATUS_LAUDO: { valor: StatusLaudo; label: string }[] = [
  { valor: "rascunho", label: "Rascunho" },
  { valor: "em_revisao", label: "Em revisão" },
  { valor: "finalizado", label: "Finalizado" },
  { valor: "entregue", label: "Entregue" },
]
