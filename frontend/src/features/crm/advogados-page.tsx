import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { Plus } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/features/auth/auth-context"
import type { Advogado, Escritorio } from "@/features/crm/types"
import { AdvogadoFormDialog } from "@/features/crm/advogado-form-dialog"

export function AdvogadosPage() {
  const { temPermissao } = useAuth()
  const queryClient = useQueryClient()
  const [dialogAberto, setDialogAberto] = useState(false)
  const [emEdicao, setEmEdicao] = useState<Advogado | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const podeEscrever = temPermissao("crm:write")

  const { data: advogados, isLoading } = useQuery({
    queryKey: ["advogados"],
    queryFn: async () => (await api.get<Advogado[]>("/advogados")).data,
  })

  const { data: escritorios } = useQuery({
    queryKey: ["escritorios"],
    queryFn: async () => (await api.get<Escritorio[]>("/escritorios")).data,
    enabled: podeEscrever,
  })

  const removerMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/advogados/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["advogados"] }),
    onError: (err) => {
      setErro(
        isAxiosError(err)
          ? (err.response?.data?.detail ?? "Falha ao remover advogado.")
          : "Falha ao remover advogado.",
      )
    },
  })

  function abrirCriacao() {
    setEmEdicao(null)
    setDialogAberto(true)
  }

  function abrirEdicao(advogado: Advogado) {
    setEmEdicao(advogado)
    setDialogAberto(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {podeEscrever && (
          <Button onClick={abrirCriacao}>
            <Plus className="size-4" />
            Novo advogado
          </Button>
        )}
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">OAB</th>
              <th className="px-4 py-3 font-medium">Escritório</th>
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
            {advogados?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum advogado cadastrado.
                </td>
              </tr>
            )}
            {advogados?.map((advogado) => (
              <tr key={advogado.id}>
                <td className="px-4 py-3 font-medium text-foreground">{advogado.nome}</td>
                <td className="px-4 py-3 text-muted-foreground">{advogado.oab || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{advogado.escritorio?.nome || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {[advogado.email, advogado.telefone].filter(Boolean).join(" · ") || "—"}
                </td>
                {podeEscrever && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => abrirEdicao(advogado)}>
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removerMutation.mutate(advogado.id)}
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
        <AdvogadoFormDialog
          advogado={emEdicao}
          escritorios={escritorios ?? []}
          onClose={() => setDialogAberto(false)}
        />
      )}
    </div>
  )
}
