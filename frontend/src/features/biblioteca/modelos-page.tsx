import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { Plus } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/features/auth/auth-context"
import { CATEGORIAS_MODELO, type Modelo } from "@/features/biblioteca/types"
import { ModeloFormDialog } from "@/features/biblioteca/modelo-form-dialog"

const LABEL_CATEGORIA = Object.fromEntries(CATEGORIAS_MODELO.map((c) => [c.valor, c.label]))

export function ModelosPage() {
  const { temPermissao } = useAuth()
  const queryClient = useQueryClient()
  const [dialogAberto, setDialogAberto] = useState(false)
  const [emEdicao, setEmEdicao] = useState<Modelo | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const podeEscrever = temPermissao("biblioteca:write")

  const { data: modelos, isLoading } = useQuery({
    queryKey: ["modelos"],
    queryFn: async () => (await api.get<Modelo[]>("/biblioteca/modelos")).data,
  })

  const removerMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/biblioteca/modelos/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["modelos"] }),
    onError: (err) => {
      setErro(
        isAxiosError(err) ? (err.response?.data?.detail ?? "Falha ao remover modelo.") : "Falha ao remover modelo.",
      )
    },
  })

  function abrirCriacao() {
    setEmEdicao(null)
    setDialogAberto(true)
  }

  function abrirEdicao(modelo: Modelo) {
    setEmEdicao(modelo)
    setDialogAberto(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {podeEscrever && (
          <Button onClick={abrirCriacao}>
            <Plus className="size-4" />
            Novo modelo
          </Button>
        )}
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
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
            {modelos?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum modelo cadastrado.
                </td>
              </tr>
            )}
            {modelos?.map((modelo) => (
              <tr key={modelo.id}>
                <td className="px-4 py-3 font-medium text-foreground">{modelo.nome}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {LABEL_CATEGORIA[modelo.categoria]}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{modelo.descricao ?? "—"}</td>
                {podeEscrever && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => abrirEdicao(modelo)}>
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removerMutation.mutate(modelo.id)}
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

      {dialogAberto && <ModeloFormDialog modelo={emEdicao} onClose={() => setDialogAberto(false)} />}
    </div>
  )
}
