import { useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { Download, Plus } from "lucide-react"
import { api } from "@/lib/api"
import { exportarCsv, formatarDataLocal } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/features/auth/auth-context"
import { SITUACOES_PROCESSO, type Processo } from "@/features/processos/types"
import { ProcessoFormDialog } from "@/features/processos/processo-form-dialog"

const LABEL_SITUACAO = Object.fromEntries(SITUACOES_PROCESSO.map((s) => [s.valor, s.label]))

export function ProcessosPage() {
  const { temPermissao } = useAuth()
  const queryClient = useQueryClient()
  const [dialogAberto, setDialogAberto] = useState(false)
  const [emEdicao, setEmEdicao] = useState<Processo | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const podeEscrever = temPermissao("processos:write")

  const { data: processos, isLoading } = useQuery({
    queryKey: ["processos"],
    queryFn: async () => (await api.get<Processo[]>("/processos")).data,
  })

  const removerMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/processos/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["processos"] }),
    onError: (err) => {
      setErro(
        isAxiosError(err)
          ? (err.response?.data?.detail ?? "Falha ao remover processo.")
          : "Falha ao remover processo.",
      )
    },
  })

  function abrirCriacao() {
    setEmEdicao(null)
    setDialogAberto(true)
  }

  function abrirEdicao(processo: Processo) {
    setEmEdicao(processo)
    setDialogAberto(true)
  }

  function exportar() {
    if (!processos) return
    exportarCsv(
      "processos.csv",
      ["Número", "Comarca", "Cliente", "Especialidade", "Prazo", "Situação"],
      processos.map((p) => [
        p.numero,
        `${p.comarca.nome}/${p.comarca.uf}`,
        p.cliente?.nome ?? "",
        p.especialidade ?? "",
        p.prazo ? formatarDataLocal(p.prazo) : "",
        LABEL_SITUACAO[p.situacao],
      ]),
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Processos</h1>
          <p className="text-sm text-muted-foreground">Gestão dos processos periciais.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportar} disabled={!processos?.length}>
            <Download className="size-4" />
            Exportar CSV
          </Button>
          {podeEscrever && (
            <Button onClick={abrirCriacao}>
              <Plus className="size-4" />
              Novo processo
            </Button>
          )}
        </div>
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Número</th>
              <th className="px-4 py-3 font-medium">Comarca</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Prazo</th>
              <th className="px-4 py-3 font-medium">Situação</th>
              {podeEscrever && <th className="px-4 py-3 font-medium text-right">Ações</th>}
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
            {processos?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum processo cadastrado.
                </td>
              </tr>
            )}
            {processos?.map((processo) => (
              <tr key={processo.id}>
                <td className="px-4 py-3 font-medium text-foreground">
                  <Link to={`/processos/${processo.id}`} className="hover:underline">
                    {processo.numero}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {processo.comarca.nome}/{processo.comarca.uf}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{processo.cliente?.nome ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {processo.prazo ? formatarDataLocal(processo.prazo) : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {LABEL_SITUACAO[processo.situacao]}
                  </span>
                </td>
                {podeEscrever && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => abrirEdicao(processo)}>
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removerMutation.mutate(processo.id)}
                        disabled={removerMutation.isPending}
                      >
                        Remover
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {dialogAberto && <ProcessoFormDialog processo={emEdicao} onClose={() => setDialogAberto(false)} />}
    </div>
  )
}
