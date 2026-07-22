import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SITUACOES_PROCESSO } from "@/features/processos/types"
import { STATUS_LAUDO } from "@/features/laudos/types"
import type { Indicadores } from "@/features/relatorios/types"

const AZUL_SEQUENCIAL = ["#dbe6f2", "#b8cce4", "#94b3d6", "#7099c8", "#4d80ba", "#2966a0", "#0f2e5c"]
const VERDE_SEQUENCIAL = ["#dcf3ea", "#a8e0cb", "#5cbf95", "#1f8a5f"]
const COR_ENTRADAS = "#059669"
const COR_SAIDAS = "#b3261e"

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })

function montarSerieOrdenada(
  dados: { categoria: string; total: number }[] | undefined,
  ordem: { valor: string; label: string }[],
) {
  const porCategoria = new Map(dados?.map((d) => [d.categoria, d.total]))
  return ordem.map((item) => ({ label: item.label, total: porCategoria.get(item.valor) ?? 0 }))
}

function formatarMesLabel(mes: string) {
  const [ano, m] = mes.split("-")
  const nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  return `${nomes[Number(m) - 1]}/${ano.slice(2)}`
}

export function RelatoriosPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["relatorios-indicadores"],
    queryFn: async () => (await api.get<Indicadores>("/relatorios/indicadores")).data,
  })

  const processos = useMemo(
    () => montarSerieOrdenada(data?.processos_por_situacao, SITUACOES_PROCESSO),
    [data],
  )
  const laudos = useMemo(() => montarSerieOrdenada(data?.laudos_por_status, STATUS_LAUDO), [data])
  const financeiro = useMemo(
    () => (data?.financeiro_mensal ?? []).map((f) => ({ ...f, mesLabel: formatarMesLabel(f.mes) })),
    [data],
  )

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Indicadores da atividade pericial.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Processos por situação</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={processos} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "var(--color-border)" }}
                  cursor={{ fill: "var(--color-muted)" }}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {processos.map((_, i) => (
                    <Cell key={i} fill={AZUL_SEQUENCIAL[i % AZUL_SEQUENCIAL.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Laudos por status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={laudos} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "var(--color-border)" }}
                  cursor={{ fill: "var(--color-muted)" }}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {laudos.map((_, i) => (
                    <Cell key={i} fill={VERDE_SEQUENCIAL[i % VERDE_SEQUENCIAL.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fluxo de caixa mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={financeiro} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="mesLabel" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
              <YAxis
                tickFormatter={(v) => formatoMoeda.format(v)}
                tick={{ fontSize: 12 }}
                stroke="var(--color-muted-foreground)"
                width={80}
              />
              <Tooltip
                formatter={(value) => formatoMoeda.format(Number(value))}
                contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "var(--color-border)" }}
                cursor={{ fill: "var(--color-muted)" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="entradas" name="Entradas" fill={COR_ENTRADAS} radius={[4, 4, 0, 0]} />
              <Bar dataKey="saidas" name="Saídas" fill={COR_SAIDAS} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
