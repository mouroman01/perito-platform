import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { Plus } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/features/auth/auth-context"
import type { Cliente } from "@/features/crm/types"
import { ClienteFormDialog } from "@/features/crm/cliente-form-dialog"

const LABEL_TIPO: Record<Cliente["tipo"], string> = {
  pessoa_fisica: "Pessoa física",
  pessoa_juridica: "Pessoa jurídica",
}

export function ClientesPage() {
  const { temPermissao } = useAuth()
  const queryClient = useQueryClient()
  const [dialogAberto, setDialogAberto] = useState(false)
  const [emEdicao, setEmEdicao] = useState<Cliente | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const podeEscrever = temPermissao("crm:write")

  const { data: clientes, isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => (await api.get<Cliente[]>("/clientes")).data,
  })

  const removerMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/clientes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clientes"] }),
    onError: (err) => {
      setErro(
        isAxiosError(err) ? (err.response?.data?.detail ?? "Falha ao remover cliente.") : "Falha ao remover cliente.",
      )
    },
  })

  function abrirCriacao() {
    setEmEdicao(null)
    setDialogAberto(true)
  }

  function abrirEdicao(cliente: Cliente) {
    setEmEdicao(cliente)
    setDialogAberto(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {podeEscrever && (
          <Button onClick={abrirCriacao}>
            <Plus className="size-4" />
            Novo cliente
          </Button>
        )}
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Documento</th>
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
            {clientes?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum cliente cadastrado.
                </td>
              </tr>
            )}
            {clientes?.map((cliente) => (
              <tr key={cliente.id}>
                <td className="px-4 py-3 font-medium text-foreground">{cliente.nome}</td>
                <td className="px-4 py-3 text-muted-foreground">{LABEL_TIPO[cliente.tipo]}</td>
                <td className="px-4 py-3 text-muted-foreground">{cliente.documento ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {[cliente.email, cliente.telefone].filter(Boolean).join(" · ") || "—"}
                </td>
                {podeEscrever && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => abrirEdicao(cliente)}>
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removerMutation.mutate(cliente.id)}
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

      {dialogAberto && <ClienteFormDialog cliente={emEdicao} onClose={() => setDialogAberto(false)} />}
    </div>
  )
}
