import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Download, Plus, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/features/auth/auth-context"
import { exportarCsv, formatarDataLocal } from "@/lib/utils"
import {
  formatarCompetencia,
  LABEL_STATUS,
  LABEL_TIPO_IMPOSTO,
  type Lancamento,
  type StatusLancamento,
  type TipoLancamento,
} from "@/features/financeiro/types"
import { LancamentoFormDialog } from "@/features/financeiro/lancamento-form-dialog"

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

const COR_STATUS: Record<StatusLancamento, string> = {
  pendente: "bg-amber-100 text-amber-700",
  pago: "bg-emerald-100 text-emerald-700",
  atrasado: "bg-red-100 text-red-700",
}

export function FinanceiroPage() {
  const { temPermissao } = useAuth()
  const queryClient = useQueryClient()
  const [dialogAberto, setDialogAberto] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState<TipoLancamento | "">("")
  const [apenasImpostos, setApenasImpostos] = useState(false)

  const podeEscrever = temPermissao("financeiro:write")

  const { data: lancamentos, isLoading } = useQuery({
    queryKey: ["financeiro", { filtroTipo, apenasImpostos }],
    queryFn: async () =>
      (
        await api.get<Lancamento[]>("/financeiro", {
          params: {
            ...(filtroTipo ? { tipo: filtroTipo } : {}),
            ...(apenasImpostos ? { somente_impostos: true } : {}),
          },
        })
      ).data,
  })

  const resumo = useMemo(() => {
    const entradas = lancamentos?.filter((l) => l.tipo === "entrada").reduce((s, l) => s + parseFloat(l.valor), 0) ?? 0
    const saidas = lancamentos?.filter((l) => l.tipo === "saida").reduce((s, l) => s + parseFloat(l.valor), 0) ?? 0
    return { entradas, saidas, saldo: entradas - saidas }
  }, [lancamentos])

  const marcarPagoMutation = useMutation({
    mutationFn: ({ id, pago_em }: { id: number; pago_em: string | null }) =>
      api.patch(`/financeiro/${id}`, { pago_em }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financeiro"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-kpis"] })
    },
  })

  const removerMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/financeiro/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financeiro"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-kpis"] })
    },
  })

  function exportar() {
    if (!lancamentos) return
    exportarCsv(
      "financeiro.csv",
      ["Descrição", "Tipo", "Valor", "Vencimento", "Processo", "Status", "Tipo de Imposto", "Competência"],
      lancamentos.map((l) => [
        l.descricao,
        l.tipo === "entrada" ? "Entrada" : "Saída",
        parseFloat(l.valor).toFixed(2).replace(".", ","),
        formatarDataLocal(l.vencimento),
        l.processo?.numero ?? "",
        LABEL_STATUS[l.status],
        l.tipo_imposto ? LABEL_TIPO_IMPOSTO[l.tipo_imposto] : "",
        l.competencia ? formatarCompetencia(l.competencia) : "",
      ]),
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Honorários, fluxo de caixa e DARF/Impostos.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportar} disabled={!lancamentos?.length}>
            <Download className="size-4" />
            Exportar CSV
          </Button>
          {podeEscrever && (
            <Button onClick={() => setDialogAberto(true)}>
              <Plus className="size-4" />
              Novo lançamento
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Entradas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-600">{formatoMoeda.format(resumo.entradas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-red-600">{formatoMoeda.format(resumo.saidas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">{formatoMoeda.format(resumo.saldo)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["", "entrada", "saida"] as const).map((valor) => (
          <button
            key={valor || "todos"}
            onClick={() => setFiltroTipo(valor)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filtroTipo === valor ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {valor === "" ? "Todos" : valor === "entrada" ? "Entradas" : "Saídas"}
          </button>
        ))}
        <button
          onClick={() => setApenasImpostos((v) => !v)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            apenasImpostos ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          Impostos (DARF)
        </button>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Vencimento</th>
              <th className="px-4 py-3 font-medium">Processo</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {podeEscrever && <th className="px-4 py-3 font-medium text-right">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {lancamentos?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum lançamento cadastrado.
                </td>
              </tr>
            )}
            {lancamentos?.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 font-medium text-foreground">
                  {l.descricao}
                  {l.tipo_imposto && (
                    <p className="text-xs font-normal text-muted-foreground">
                      {LABEL_TIPO_IMPOSTO[l.tipo_imposto]}
                      {l.competencia && ` · ${formatarCompetencia(l.competencia)}`}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{l.tipo === "entrada" ? "Entrada" : "Saída"}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatoMoeda.format(parseFloat(l.valor))}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatarDataLocal(l.vencimento)}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {l.processo ? (
                    <Link to={`/processos/${l.processo.id}`} className="hover:underline">
                      {l.processo.numero}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${COR_STATUS[l.status]}`}>
                    {LABEL_STATUS[l.status]}
                  </span>
                </td>
                {podeEscrever && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {l.status !== "pago" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            marcarPagoMutation.mutate({ id: l.id, pago_em: new Date().toISOString().slice(0, 10) })
                          }
                        >
                          Marcar pago
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => marcarPagoMutation.mutate({ id: l.id, pago_em: null })}
                        >
                          Desfazer
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => removerMutation.mutate(l.id)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {dialogAberto && <LancamentoFormDialog onClose={() => setDialogAberto(false)} />}
    </div>
  )
}
