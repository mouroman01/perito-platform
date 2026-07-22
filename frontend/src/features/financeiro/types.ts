export type TipoLancamento = "entrada" | "saida"
export type StatusLancamento = "pendente" | "pago" | "atrasado"
export type TipoImposto = "darf_inss" | "darf_irpf" | "iss" | "outro"

export interface Lancamento {
  id: number
  tipo: TipoLancamento
  descricao: string
  valor: string
  vencimento: string
  pago_em: string | null
  observacoes: string | null
  processo: { id: number; numero: string } | null
  status: StatusLancamento
  tipo_imposto: TipoImposto | null
  competencia: string | null
}

export const LABEL_STATUS: Record<StatusLancamento, string> = {
  pendente: "Pendente",
  pago: "Pago",
  atrasado: "Atrasado",
}

export const TIPOS_IMPOSTO: { valor: TipoImposto; label: string }[] = [
  { valor: "darf_inss", label: "DARF - INSS" },
  { valor: "darf_irpf", label: "DARF - IRPF" },
  { valor: "iss", label: "ISS" },
  { valor: "outro", label: "Outro" },
]

export const LABEL_TIPO_IMPOSTO: Record<TipoImposto, string> = Object.fromEntries(
  TIPOS_IMPOSTO.map((t) => [t.valor, t.label]),
) as Record<TipoImposto, string>

export function formatarCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split("-")
  return `${mes}/${ano}`
}
