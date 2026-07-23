import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { Plus } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/features/auth/auth-context"
import type { Comarca } from "@/features/crm/types"
import { ComarcaFormDialog } from "@/features/crm/comarca-form-dialog"

export function ComarcasPage() {
  const { temPermissao } = useAuth()
  const queryClient = useQueryClient()
  const [dialogAberto, setDialogAberto] = useState(false)
  const [emEdicao, setEmEdicao] = useState<Comarca | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const podeEscrever = temPermissao("crm:write")

  const { data: comarcas, isLoading } = useQuery({
    queryKey: ["comarcas"],
    queryFn: async () => (await api.get<Comarca[]>("/comarcas")).data,
  })

  const removerMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/comarcas/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comarcas"] }),
    onError: (err) => {
      setErro(
        isAxiosError(err) ? (err.response?.data?.detail ?? "Falha ao remover comarca.") : "Falha ao remover comarca.",
      )
    },
  })

  function abrirCriacao() {
    setEmEdicao(null)
    setDialogAberto(true)
  }

  function abrirEdicao(comarca: Comarca) {
    setEmEdicao(comarca)
    setDialogAberto(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {podeEscrever && (
          <Button onClick={abrirCriacao}>
            <Plus className="size-4" />
            Nova comarca
          </Button>
        )}
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">UF</th>
              <th className="px-4 py-3 font-medium">Tribunal</th>
              {podeEscrever && <th className="px-4 py-3 font-medium text-right">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {comarcas?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhuma comarca cadastrada.
                </td>
              </tr>
            )}
            {comarcas?.map((comarca) => (
              <tr key={comarca.id}>
                <td className="px-4 py-3 font-medium text-foreground">{comarca.nome}</td>
                <td className="px-4 py-3 text-muted-foreground">{comarca.uf}</td>
                <td className="px-4 py-3 text-muted-foreground">{comarca.tribunal ?? "—"}</td>
                {podeEscrever && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => abrirEdicao(comarca)}>
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removerMutation.mutate(comarca.id)}
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

      {dialogAberto && <ComarcaFormDialog comarca={emEdicao} onClose={() => setDialogAberto(false)} />}
    </div>
  )
}
