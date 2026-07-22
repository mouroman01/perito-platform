import { useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/features/auth/auth-context"
import { TIPOS_COMPROMISSO, type Compromisso } from "@/features/agenda/types"
import { AgendaFormDialog } from "@/features/agenda/agenda-form-dialog"

const LABEL_TIPO = Object.fromEntries(TIPOS_COMPROMISSO.map((t) => [t.valor, t.label]))

export function AgendaPage() {
  const { temPermissao } = useAuth()
  const queryClient = useQueryClient()
  const [dialogAberto, setDialogAberto] = useState(false)

  const podeEscrever = temPermissao("agenda:write")

  const { data: compromissos, isLoading } = useQuery({
    queryKey: ["agenda"],
    queryFn: async () => (await api.get<Compromisso[]>("/agenda")).data,
  })

  const concluirMutation = useMutation({
    mutationFn: ({ id, concluido }: { id: number; concluido: boolean }) =>
      api.patch(`/agenda/${id}`, { concluido }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agenda"] }),
  })

  const removerMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/agenda/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agenda"] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Agenda</h1>
          <p className="text-sm text-muted-foreground">
            Audiências, perícias, diligências, reuniões e lembretes.
          </p>
        </div>
        {podeEscrever && (
          <Button onClick={() => setDialogAberto(true)}>
            <Plus className="size-4" />
            Novo compromisso
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Data/Hora</th>
              <th className="px-4 py-3 font-medium">Título</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Processo</th>
              <th className="px-4 py-3 font-medium">Concluído</th>
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
            {compromissos?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum compromisso cadastrado.
                </td>
              </tr>
            )}
            {compromissos?.map((c) => (
              <tr key={c.id} className={c.concluido ? "opacity-50" : ""}>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(c.data_hora).toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {c.titulo}
                  {c.local && <span className="block text-xs text-muted-foreground">{c.local}</span>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{LABEL_TIPO[c.tipo]}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.processo ? (
                    <Link to={`/processos/${c.processo.id}`} className="hover:underline">
                      {c.processo.numero}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={c.concluido}
                    disabled={!podeEscrever}
                    onChange={(e) => concluirMutation.mutate({ id: c.id, concluido: e.target.checked })}
                  />
                </td>
                {podeEscrever && (
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => removerMutation.mutate(c.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {dialogAberto && <AgendaFormDialog onClose={() => setDialogAberto(false)} />}
    </div>
  )
}
