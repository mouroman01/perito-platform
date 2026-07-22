import { useState, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Escritorio } from "@/features/crm/types"

interface Props {
  escritorio: Escritorio | null
  onClose: () => void
}

export function EscritorioFormDialog({ escritorio, onClose }: Props) {
  const queryClient = useQueryClient()
  const editando = escritorio !== null

  const [nome, setNome] = useState(escritorio?.nome ?? "")
  const [cnpj, setCnpj] = useState(escritorio?.cnpj ?? "")
  const [email, setEmail] = useState(escritorio?.email ?? "")
  const [telefone, setTelefone] = useState(escritorio?.telefone ?? "")
  const [cidade, setCidade] = useState(escritorio?.cidade ?? "")
  const [uf, setUf] = useState(escritorio?.uf ?? "")
  const [observacoes, setObservacoes] = useState(escritorio?.observacoes ?? "")
  const [erro, setErro] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nome,
        cnpj: cnpj || null,
        email: email || null,
        telefone: telefone || null,
        cidade: cidade || null,
        uf: uf || null,
        observacoes: observacoes || null,
      }
      if (editando) {
        return api.patch(`/escritorios/${escritorio.id}`, payload)
      }
      return api.post("/escritorios", payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escritorios"] })
      onClose()
    },
    onError: (err) => {
      setErro(
        isAxiosError(err)
          ? (err.response?.data?.detail ?? "Falha ao salvar escritório.")
          : "Falha ao salvar escritório.",
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
          {editando ? "Editar escritório" : "Novo escritório"}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
          </div>
          <div className="grid grid-cols-[1fr_5rem] gap-3">
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uf">UF</Label>
              <Input
                id="uf"
                maxLength={2}
                value={uf}
                onChange={(e) => setUf(e.target.value.toUpperCase())}
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
