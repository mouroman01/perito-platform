import { useState, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Cliente, TipoPessoa } from "@/features/crm/types"

interface Props {
  cliente: Cliente | null
  onClose: () => void
}

export function ClienteFormDialog({ cliente, onClose }: Props) {
  const queryClient = useQueryClient()
  const editando = cliente !== null

  const [nome, setNome] = useState(cliente?.nome ?? "")
  const [tipo, setTipo] = useState<TipoPessoa>(cliente?.tipo ?? "pessoa_fisica")
  const [documento, setDocumento] = useState(cliente?.documento ?? "")
  const [email, setEmail] = useState(cliente?.email ?? "")
  const [telefone, setTelefone] = useState(cliente?.telefone ?? "")
  const [erro, setErro] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nome,
        tipo,
        documento: documento || null,
        email: email || null,
        telefone: telefone || null,
      }
      if (editando) {
        return api.patch(`/clientes/${cliente.id}`, payload)
      }
      return api.post("/clientes", payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] })
      onClose()
    },
    onError: (err) => {
      setErro(
        isAxiosError(err) ? (err.response?.data?.detail ?? "Falha ao salvar cliente.") : "Falha ao salvar cliente.",
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
        <h2 className="text-lg font-semibold text-foreground">{editando ? "Editar cliente" : "Novo cliente"}</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <select
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoPessoa)}
              className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <option value="pessoa_fisica">Pessoa física</option>
              <option value="pessoa_juridica">Pessoa jurídica</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="documento">CPF/CNPJ (opcional)</Label>
            <Input id="documento" value={documento} onChange={(e) => setDocumento(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </div>
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
