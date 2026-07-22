import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { Plus } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/features/auth/auth-context"
import type { Comarca, Magistrado } from "@/features/crm/types"
import { MagistradoFormDialog } from "@/features/crm/magistrado-form-dialog"

export function MagistradosPage() {
  const { temPermissao } = useAuth()
  const queryClient = useQueryClient()
  const [dialogAberto, setDialogAberto] = useState(false)
  const [emEdicao, setEmEdicao] = useState<Magistrado | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const podeEscrever = temPermissao("crm:write")

  const { data: magistrados, isLoading } = useQuery({
    queryKey: ["magistrados"],
    queryFn: async () => (await api.get<Magistrado[]>("/magistrados")).data,
  })

  const { data: comarcas } = useQuery({
    queryKey: ["comarcas"],
    queryFn: async () => (await api.get<Comarca[]>("/comarcas")).data,
    enabled: podeEscrever,
  })

  const removerMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/magistrados/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["magistrados"] }),
    onError: (err) => {
      setErro(
        isAxiosError(err)
          ? (err.response?.data?.detail ?? "Falha ao remover magistrado.")
          : "Falha ao remover magistrado.",
      )
    },
  })

  function abrirCriacao() {
    setEmEdicao(null)
    setDialogAberto(true)
  }

  function abrirEdicao(magistrado: Magistrado) {
    setEmEdicao(magistrado)
    setDialogAberto(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {podeEscrever && (
          <Button onClick={abrirCriacao} disabled={!comarcas?.length}>
            <Plus className="size-4" />
            Novo magistrado
          </Button>
        )}
      </div>

      {podeEscrever && comarcas?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Cadastre ao menos uma comarca antes de adicionar magistrados.
        </p>
      )}

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Cargo / Vara</th>
              <th className="px-4 py-3 font-medium">Comarca</th>
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
            {magistrados?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum magistrado cadastrado.
                </td>
              </tr>
            )}
            {magistrados?.map((magistrado) => (
              <tr key={magistrado.id}>
                <td className="px-4 py-3 font-medium text-foreground">{magistrado.nome}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {[magistrado.cargo, magistrado.vara].filter(Boolean).join(" — ") || "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {magistrado.comarca.nome}/{magistrado.comarca.uf}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {[magistrado.email, magistrado.telefone].filter(Boolean).join(" · ") || "—"}
                </td>
                {podeEscrever && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => abrirEdicao(magistrado)}>
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removerMutation.mutate(magistrado.id)}
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
        <MagistradoFormDialog
          magistrado={emEdicao}
          comarcas={comarcas ?? []}
          onClose={() => setDialogAberto(false)}
        />
      )}
    </div>
  )
}
