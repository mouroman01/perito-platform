import { useState, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Contato } from "@/features/crm/types"

interface Props {
  contato: Contato | null
  onClose: () => void
}

export function ContatoFormDialog({ contato, onClose }: Props) {
  const queryClient = useQueryClient()
  const editando = contato !== null

  const [nome, setNome] = useState(contato?.nome ?? "")
  const [cargo, setCargo] = useState(contato?.cargo ?? "")
  const [organizacao, setOrganizacao] = useState(contato?.organizacao ?? "")
  const [email, setEmail] = useState(contato?.email ?? "")
  const [telefone, setTelefone] = useState(contato?.telefone ?? "")
  const [observacoes, setObservacoes] = useState(contato?.observacoes ?? "")
  const [erro, setErro] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nome,
        cargo: cargo || null,
        organizacao: organizacao || null,
        email: email || null,
        telefone: telefone || null,
        observacoes: observacoes || null,
      }
      if (editando) {
        return api.patch(`/contatos/${contato.id}`, payload)
      }
      return api.post("/contatos", payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contatos"] })
      onClose()
    },
    onError: (err) => {
      setErro(
        isAxiosError(err)
          ? (err.response?.data?.detail ?? "Falha ao salvar contato.")
          : "Falha ao salvar contato.",
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
        <h2 className="text-lg font-semibold text-foreground">
          {editando ? "Editar contato" : "Novo contato"}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input id="cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizacao">Organização</Label>
              <Input
                id="organizacao"
                value={organizacao}
                onChange={(e) => setOrganizacao(e.target.value)}
              />
            </div>
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
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
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
