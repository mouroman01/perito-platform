import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { Plus } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/features/auth/auth-context"
import type { Contato } from "@/features/crm/types"
import { ContatoFormDialog } from "@/features/crm/contato-form-dialog"

export function ContatosPage() {
  const { temPermissao } = useAuth()
  const queryClient = useQueryClient()
  const [dialogAberto, setDialogAberto] = useState(false)
  const [emEdicao, setEmEdicao] = useState<Contato | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const podeEscrever = temPermissao("crm:write")

  const { data: contatos, isLoading } = useQuery({
    queryKey: ["contatos"],
    queryFn: async () => (await api.get<Contato[]>("/contatos")).data,
  })

  const removerMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/contatos/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contatos"] }),
    onError: (err) => {
      setErro(
        isAxiosError(err)
          ? (err.response?.data?.detail ?? "Falha ao remover contato.")
          : "Falha ao remover contato.",
      )
    },
  })

  function abrirCriacao() {
    setEmEdicao(null)
    setDialogAberto(true)
  }

  function abrirEdicao(contato: Contato) {
    setEmEdicao(contato)
    setDialogAberto(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {podeEscrever && (
          <Button onClick={abrirCriacao}>
            <Plus className="size-4" />
            Novo contato
          </Button>
        )}
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Cargo</th>
              <th className="px-4 py-3 font-medium">Organização</th>
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
            {contatos?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum contato cadastrado.
                </td>
              </tr>
            )}
            {contatos?.map((contato) => (
              <tr key={contato.id}>
                <td className="px-4 py-3 font-medium text-foreground">{contato.nome}</td>
                <td className="px-4 py-3 text-muted-foreground">{contato.cargo || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{contato.organizacao || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {[contato.email, contato.telefone].filter(Boolean).join(" · ") || "—"}
                </td>
                {podeEscrever && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => abrirEdicao(contato)}>
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removerMutation.mutate(contato.id)}
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
        <ContatoFormDialog contato={emEdicao} onClose={() => setDialogAberto(false)} />
      )}
    </div>
  )
}
