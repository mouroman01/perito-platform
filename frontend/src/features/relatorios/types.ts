export interface ContagemPorCategoria {
  categoria: string
  total: number
}

export interface FinanceiroMensal {
  mes: string
  entradas: number
  saidas: number
}

export interface Indicadores {
  processos_por_situacao: ContagemPorCategoria[]
  laudos_por_status: ContagemPorCategoria[]
  financeiro_mensal: FinanceiroMensal[]
}
