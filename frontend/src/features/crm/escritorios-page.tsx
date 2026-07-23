import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { Plus } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/features/auth/auth-context"
import type { Escritorio } from "@/features/crm/types"
import { EscritorioFormDialog } from "@/features/crm/escritorio-form-dialog"

export function EscritoriosPage() {
  const { temPermissao } = useAuth()
  const queryClient = useQueryClient()
  const [dialogAberto, setDialogAberto] = useState(false)
  const [emEdicao, setEmEdicao] = useState<Escritorio | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const podeEscrever = temPermissao("crm:write")

  const { data: escritorios, isLoading } = useQuery({
    queryKey: ["escritorios"],
    queryFn: async () => (await api.get<Escritorio[]>("/escritorios")).data,
  })

  const removerMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/escritorios/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["escritorios"] }),
    onError: (err) => {
      setErro(
        isAxiosError(err)
          ? (err.response?.data?.detail ?? "Falha ao remover escritório.")
          : "Falha ao remover escritório.",
      )
    },
  })

  function abrirCriacao() {
    setEmEdicao(null)
    setDialogAberto(true)
  }

  function abrirEdicao(escritorio: Escritorio) {
    setEmEdicao(escritorio)
    setDialogAberto(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {podeEscrever && (
          <Button onClick={abrirCriacao}>
            <Plus className="size-4" />
            Novo escritório
          </Button>
        )}
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">CNPJ</th>
              <th className="px-4 py-3 font-medium">Cidade / UF</th>
              <th className="px-4 py-3 font-medium">Contato</th>
              {podeEscrever && <th className="px-4 py-3 font-medium text-right">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {escritorios?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum escritório cadastrado.
                </td>
              </tr>
            )}
            {escritorios?.map((escritorio) => (
              <tr key={escritorio.id}>
                <td className="px-4 py-3 font-medium text-foreground">{escritorio.nome}</td>
                <td className="px-4 py-3 text-muted-foreground">{escritorio.cnpj || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {[escritorio.cidade, escritorio.uf].filter(Boolean).join("/") || "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {[escritorio.email, escritorio.telefone].filter(Boolean).join(" · ") || "—"}
                </td>
                {podeEscrever && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => abrirEdicao(escritorio)}>
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removerMutation.mutate(escritorio.id)}
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

      {dialogAberto && (
        <EscritorioFormDialog escritorio={emEdicao} onClose={() => setDialogAberto(false)} />
      )}
    </div>
  )
}
