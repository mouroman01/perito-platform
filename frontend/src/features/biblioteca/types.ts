export type CategoriaModelo = "contrato" | "laudo" | "quesito" | "parecer" | "recibo" | "proposta"

export interface Modelo {
  id: number
  nome: string
  categoria: CategoriaModelo
  conteudo: string
  descricao: string | null
}

export const CATEGORIAS_MODELO: { valor: CategoriaModelo; label: string }[] = [
  { valor: "contrato", label: "Contrato" },
  { valor: "laudo", label: "Laudo" },
  { valor: "quesito", label: "Quesito" },
  { valor: "parecer", label: "Parecer" },
  { valor: "recibo", label: "Recibo" },
  { valor: "proposta", label: "Proposta" },
]
