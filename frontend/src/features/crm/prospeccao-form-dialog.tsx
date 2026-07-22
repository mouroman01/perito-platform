import { useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/features/auth/auth-context"
import type { Usuario } from "@/features/auth/types"
import type { Cliente } from "@/features/crm/types"

interface Props {
  onClose: () => void
}

export function ProspeccaoFormDialog({ onClose }: Props) {
  const { usuario } = useAuth()
  const queryClient = useQueryClient()

  const [nome, setNome] = useState("")
  const [origem, setOrigem] = useState("")
  const [contato, setContato] = useState("")
  const [clienteId, setClienteId] = useState<number | "">("")
  const [responsavelId, setResponsavelId] = useState<number | "">(usuario?.id ?? "")
  const [erro, setErro] = useState<string | null>(null)

  const { data: clientes } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => (await api.get<Cliente[]>("/clientes")).data,
  })

  const { data: usuarios } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => (await api.get<Usuario[]>("/usuarios")).data,
  })

  const mutation = useMutation({
    mutationFn: async () =>
      api.post("/prospeccoes", {
        nome,
        origem: origem || null,
        contato: contato || null,
        cliente_id: clienteId || null,
        responsavel_id: responsavelId || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospeccoes"] })
      onClose()
    },
    onError: (err) => {
      setErro(
        isAxiosError(err)
          ? (err.response?.data?.detail ?? "Falha ao criar prospecção.")
          : "Falha ao criar prospecção.",
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
        <h2 className="text-lg font-semibold text-foreground">Nova prospecção</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome / empresa</Label>
            <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="origem">Origem (opcional)</Label>
            <Input
              id="origem"
              placeholder="Indicação, site, evento..."
              value={origem}
              onChange={(e) => setOrigem(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contato">Contato (opcional)</Label>
            <Input
              id="contato"
              placeholder="E-mail ou telefone"
              value={contato}
              onChange={(e) => setContato(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente vinculado (opcional)</Label>
            <select
              id="cliente"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value ? Number(e.target.value) : "")}
              className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <option value="">Nenhum</option>
              {clientes?.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável (opcional)</Label>
            <select
              id="responsavel"
              value={responsavelId}
              onChange={(e) => setResponsavelId(e.target.value ? Number(e.target.value) : "")}
              className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <option value="">Nenhum</option>
              {usuarios?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
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
