import { useQuery } from "@tanstack/react-query"
import { Briefcase, Calendar, FileCheck2, FileText, Users, Wallet } from "lucide-react"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DashboardKPIs } from "@/features/dashboard/types"

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

const cartoes = [
  { chave: "processos_ativos", label: "Processos ativos", icon: Briefcase },
  { chave: "nomeacoes_pendentes", label: "Nomeações pendentes", icon: FileText },
  { chave: "laudos_em_andamento", label: "Laudos em andamento", icon: FileCheck2 },
  { chave: "prazos_proximos_7_dias", label: "Prazos nos próximos 7 dias", icon: Calendar },
  { chave: "usuarios_ativos", label: "Usuários ativos", icon: Users },
] as const

export function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: async () => {
      const { data } = await api.get<DashboardKPIs>("/dashboard")
      return data
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral da atividade pericial.</p>
      </div>

      {isError && (
        <p className="text-sm text-destructive">Não foi possível carregar os indicadores.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cartoes.map(({ chave, label, icon: Icon }) => (
          <Card key={chave}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">
                {isLoading ? "—" : data?.[chave]}
              </p>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Honorários a receber</CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-foreground">
              {isLoading ? "—" : formatoMoeda.format(data?.honorarios_a_receber ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        Indicadores de Processos, Nomeações, Laudos e Financeiro serão preenchidos conforme os
        respectivos módulos forem implementados (fases 3 a 5 do roadmap).
      </p>
    </div>
  )
}
