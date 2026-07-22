import { useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Processo } from "@/features/processos/types"
import { TIPOS_COMPROMISSO, type TipoCompromisso } from "@/features/agenda/types"

interface Props {
  onClose: () => void
}

export function AgendaFormDialog({ onClose }: Props) {
  const queryClient = useQueryClient()

  const [titulo, setTitulo] = useState("")
  const [tipo, setTipo] = useState<TipoCompromisso>("lembrete")
  const [dataHora, setDataHora] = useState("")
  const [local, setLocal] = useState("")
  const [processoId, setProcessoId] = useState<number | "">("")
  const [erro, setErro] = useState<string | null>(null)

  const { data: processos } = useQuery({
    queryKey: ["processos"],
    queryFn: async () => (await api.get<Processo[]>("/processos")).data,
  })

  const mutation = useMutation({
    mutationFn: async () =>
      api.post("/agenda", {
        titulo,
        tipo,
        data_hora: new Date(dataHora).toISOString(),
        local: local || null,
        processo_id: processoId || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda"] })
      onClose()
    },
    onError: (err) => {
      setErro(
        isAxiosError(err)
          ? (err.response?.data?.detail ?? "Falha ao criar compromisso.")
          : "Falha ao criar compromisso.",
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
        <h2 className="text-lg font-semibold text-foreground">Novo compromisso</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input id="titulo" required value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <select
                id="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoCompromisso)}
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {TIPOS_COMPROMISSO.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_hora">Data/hora</Label>
              <Input
                id="data_hora"
                type="datetime-local"
                required
                value={dataHora}
                onChange={(e) => setDataHora(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="local">Local (opcional)</Label>
            <Input id="local" value={local} onChange={(e) => setLocal(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="processo">Processo vinculado (opcional)</Label>
            <select
              id="processo"
              value={processoId}
              onChange={(e) => setProcessoId(e.target.value ? Number(e.target.value) : "")}
              className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <option value="">Nenhum</option>
              {processos?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.numero}
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
              {mutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
