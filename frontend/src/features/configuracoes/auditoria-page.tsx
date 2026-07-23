import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Card } from "@/components/ui/card"
import type { LogAuditoria } from "@/features/configuracoes/types"

function corStatus(status: number) {
  if (status >= 500) return "bg-red-100 text-red-700"
  if (status >= 400) return "bg-amber-100 text-amber-700"
  return "bg-emerald-100 text-emerald-700"
}

const LABEL_METODO: Record<string, string> = {
  POST: "Criação",
  PATCH: "Atualização",
  PUT: "Atualização",
  DELETE: "Remoção",
}

export function AuditoriaPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["auditoria"],
    queryFn: async () => (await api.get<LogAuditoria[]>("/auditoria")).data,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">Auditoria: registro de ações de escrita na plataforma.</p>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Data/Hora</th>
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">Ação</th>
              <th className="px-4 py-3 font-medium">Recurso</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {logs?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum registro de auditoria.
                </td>
              </tr>
            )}
            {logs?.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(log.criado_em).toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{log.usuario?.nome ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{LABEL_METODO[log.metodo] ?? log.metodo}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.caminho}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${corStatus(log.status_code)}`}>
                    {log.status_code}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{log.ip ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
