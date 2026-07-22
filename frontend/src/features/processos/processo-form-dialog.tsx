import { useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Cliente, Comarca, Magistrado } from "@/features/crm/types"
import type { Processo } from "@/features/processos/types"

interface Props {
  processo: Processo | null
  onClose: () => void
}

export function ProcessoFormDialog({ processo, onClose }: Props) {
  const queryClient = useQueryClient()
  const editando = processo !== null

  const [numero, setNumero] = useState(processo?.numero ?? "")
  const [comarcaId, setComarcaId] = useState<number | "">(processo?.comarca.id ?? "")
  const [magistradoId, setMagistradoId] = useState<number | "">(processo?.magistrado?.id ?? "")
  const [clienteId, setClienteId] = useState<number | "">(processo?.cliente?.id ?? "")
  const [especialidade, setEspecialidade] = useState(processo?.especialidade ?? "")
  const [prazo, setPrazo] = useState(processo?.prazo ?? "")
  const [partes, setPartes] = useState(processo?.partes ?? "")
  const [objeto, setObjeto] = useState(processo?.objeto ?? "")
  const [erro, setErro] = useState<string | null>(null)

  const { data: comarcas } = useQuery({
    queryKey: ["comarcas"],
    queryFn: async () => (await api.get<Comarca[]>("/comarcas")).data,
  })
  const { data: magistrados } = useQuery({
    queryKey: ["magistrados"],
    queryFn: async () => (await api.get<Magistrado[]>("/magistrados")).data,
  })
  const { data: clientes } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => (await api.get<Cliente[]>("/clientes")).data,
  })

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        numero,
        comarca_id: comarcaId || undefined,
        magistrado_id: magistradoId || null,
        cliente_id: clienteId || null,
        especialidade: especialidade || null,
        prazo: prazo || null,
        partes: partes || null,
        objeto: objeto || null,
      }
      if (editando) {
        return api.patch(`/processos/${processo.id}`, payload)
      }
      return api.post("/processos", payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processos"] })
      onClose()
    },
    onError: (err) => {
      setErro(
        isAxiosError(err)
          ? (err.response?.data?.detail ?? "Falha ao salvar processo.")
          : "Falha ao salvar processo.",
      )
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    mutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-8">
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-foreground">{editando ? "Editar processo" : "Novo processo"}</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="numero">Número do processo</Label>
              <Input id="numero" required value={numero} onChange={(e) => setNumero(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="especialidade">Especialidade</Label>
              <Input
                id="especialidade"
                value={especialidade}
                onChange={(e) => setEspecialidade(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="comarca">Comarca</Label>
              <select
                id="comarca"
                required
                value={comarcaId}
                onChange={(e) => setComarcaId(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <option value="" disabled>
                  Selecione
                </option>
                {comarcas?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}/{c.uf}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="magistrado">Magistrado (opcional)</Label>
              <select
                id="magistrado"
                value={magistradoId}
                onChange={(e) => setMagistradoId(e.target.value ? Number(e.target.value) : "")}
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <option value="">Nenhum</option>
                {magistrados?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente (opcional)</Label>
              <select
                id="cliente"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value ? Number(e.target.value) : "")}
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <option value="">Nenhum</option>
                {clientes?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prazo">Prazo (opcional)</Label>
              <Input id="prazo" type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="partes">Partes (opcional)</Label>
            <Input id="partes" value={partes} onChange={(e) => setPartes(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objeto">Objeto (opcional)</Label>
            <Input id="objeto" value={objeto} onChange={(e) => setObjeto(e.target.value)} />
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
