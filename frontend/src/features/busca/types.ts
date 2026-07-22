export type TipoResultadoBusca =
  | "processo"
  | "cliente"
  | "advogado"
  | "escritorio"
  | "contato"
  | "magistrado"
  | "comarca"
  | "laudo"

export interface ResultadoBusca {
  tipo: TipoResultadoBusca
  id: number
  titulo: string
  subtitulo: string | null
  url: string
}

export const LABEL_TIPO_BUSCA: Record<TipoResultadoBusca, string> = {
  processo: "Processo",
  cliente: "Cliente",
  advogado: "Advogado",
  escritorio: "Escritório",
  contato: "Contato",
  magistrado: "Magistrado",
  comarca: "Comarca",
  laudo: "Laudo",
}
