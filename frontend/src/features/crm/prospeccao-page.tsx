import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { Plus } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/features/auth/auth-context"
import { ESTAGIOS_PROSPECCAO, type EstagioProspeccao, type Prospeccao } from "@/features/crm/types"
import { ProspeccaoFormDialog } from "@/features/crm/prospeccao-form-dialog"

export function ProspeccaoPage() {
  const { temPermissao } = useAuth()
  const queryClient = useQueryClient()
  const [dialogAberto, setDialogAberto] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const podeEscrever = temPermissao("crm:write")

  const { data: prospeccoes, isLoading } = useQuery({
    queryKey: ["prospeccoes"],
    queryFn: async () => (await api.get<Prospeccao[]>("/prospeccoes")).data,
  })

  const mudarEstagioMutation = useMutation({
    mutationFn: ({ id, estagio }: { id: number; estagio: EstagioProspeccao }) =>
      api.patch(`/prospeccoes/${id}`, { estagio }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prospeccoes"] }),
    onError: (err) => {
      setErro(
        isAxiosError(err)
          ? (err.response?.data?.detail ?? "Falha ao mover prospecção.")
          : "Falha ao mover prospecção.",
      )
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {podeEscrever && (
          <Button onClick={() => setDialogAberto(true)}>
            <Plus className="size-4" />
            Nova prospecção
          </Button>
        )}
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-5">
          {ESTAGIOS_PROSPECCAO.map(({ valor, label }) => {
            const itens = prospeccoes?.filter((p) => p.estagio === valor) ?? []
            return (
              <div key={valor} className="min-w-[220px] space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-semibold text-foreground">{label}</h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {itens.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {itens.map((item) => (
                    <Card key={item.id} className="p-3">
                      <p className="text-sm font-medium text-foreground">{item.nome}</p>
                      {item.cliente && (
                        <p className="text-xs text-muted-foreground">Cliente: {item.cliente.nome}</p>
                      )}
                      {item.responsavel && (
                        <p className="text-xs text-muted-foreground">Resp.: {item.responsavel.nome}</p>
                      )}
                      {podeEscrever && (
                        <select
                          value={item.estagio}
                          onChange={(e) =>
                            mudarEstagioMutation.mutate({
                              id: item.id,
                              estagio: e.target.value as EstagioProspeccao,
                            })
                          }
                          className="mt-2 h-8 w-full rounded-md border border-border bg-card px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                          {ESTAGIOS_PROSPECCAO.map((estagio) => (
                            <option key={estagio.valor} value={estagio.valor}>
                              {estagio.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </Card>
                  ))}
                  {itens.length === 0 && (
                    <p className="px-1 text-xs text-muted-foreground">Nenhum registro.</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {dialogAberto && <ProspeccaoFormDialog onClose={() => setDialogAberto(false)} />}
    </div>
  )
}
