import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Processo } from "@/features/processos/types"
import type { Modelo } from "@/features/biblioteca/types"
import type { Laudo } from "@/features/laudos/types"

interface Props {
  processoId?: number
  onClose: () => void
}

export function LaudoFormDialog({ processoId, onClose }: Props) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [titulo, setTitulo] = useState("")
  const [processoSelecionado, setProcessoSelecionado] = useState<number | "">(processoId ?? "")
  const [modeloId, setModeloId] = useState<number | "">("")
  const [erro, setErro] = useState<string | null>(null)

  const { data: processos } = useQuery({
    queryKey: ["processos"],
    queryFn: async () => (await api.get<Processo[]>("/processos")).data,
    enabled: processoId === undefined,
  })

  const { data: modelos } = useQuery({
    queryKey: ["modelos"],
    queryFn: async () => (await api.get<Modelo[]>("/biblioteca/modelos")).data,
  })

  const mutation = useMutation({
    mutationFn: async () =>
      (
        await api.post<Laudo>("/laudos", {
          titulo,
          processo_id: processoSelecionado,
          modelo_id: modeloId || null,
        })
      ).data,
    onSuccess: (laudo) => {
      queryClient.invalidateQueries({ queryKey: ["laudos"] })
      onClose()
      navigate(`/laudos/${laudo.id}`)
    },
    onError: (err) => {
      setErro(
        isAxiosError(err) ? (err.response?.data?.detail ?? "Falha ao criar laudo.") : "Falha ao criar laudo.",
      )
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    mutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-foreground">Novo laudo</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input id="titulo" required value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          {processoId === undefined && (
            <div className="space-y-2">
              <Label htmlFor="processo">Processo</Label>
              <select
                id="processo"
                required
                value={processoSelecionado}
                onChange={(e) => setProcessoSelecionado(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <option value="" disabled>
                  Selecione um processo
                </option>
                {processos?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.numero}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="modelo">Iniciar a partir de um modelo (opcional)</Label>
            <select
              id="modelo"
              value={modeloId}
              onChange={(e) => setModeloId(e.target.value ? Number(e.target.value) : "")}
              className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <option value="">Nenhum (começar em branco)</option>
              {modelos?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>

          {erro && <p className="text-sm text-destructive">{erro}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Criando..." : "Criar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
