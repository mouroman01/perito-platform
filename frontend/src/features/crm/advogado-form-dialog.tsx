import { useState, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Advogado, Escritorio } from "@/features/crm/types"

interface Props {
  advogado: Advogado | null
  escritorios: Escritorio[]
  onClose: () => void
}

export function AdvogadoFormDialog({ advogado, escritorios, onClose }: Props) {
  const queryClient = useQueryClient()
  const editando = advogado !== null

  const [nome, setNome] = useState(advogado?.nome ?? "")
  const [oab, setOab] = useState(advogado?.oab ?? "")
  const [email, setEmail] = useState(advogado?.email ?? "")
  const [telefone, setTelefone] = useState(advogado?.telefone ?? "")
  const [escritorioId, setEscritorioId] = useState<number | "">(advogado?.escritorio?.id ?? "")
  const [observacoes, setObservacoes] = useState(advogado?.observacoes ?? "")
  const [erro, setErro] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nome,
        oab: oab || null,
        email: email || null,
        telefone: telefone || null,
        escritorio_id: escritorioId || null,
        observacoes: observacoes || null,
      }
      if (editando) {
        return api.patch(`/advogados/${advogado.id}`, payload)
      }
      return api.post("/advogados", payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advogados"] })
      onClose()
    },
    onError: (err) => {
      setErro(
        isAxiosError(err)
          ? (err.response?.data?.detail ?? "Falha ao salvar advogado.")
          : "Falha ao salvar advogado.",
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
          {editando ? "Editar advogado" : "Novo advogado"}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-[1fr_9rem] gap-3">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oab">OAB</Label>
              <Input id="oab" value={oab} onChange={(e) => setOab(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="escritorio">Escritório</Label>
            <select
              id="escritorio"
              value={escritorioId}
              onChange={(e) => setEscritorioId(e.target.value ? Number(e.target.value) : "")}
              className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <option value="">Sem escritório</option>
              {escritorios.map((escritorio) => (
                <option key={escritorio.id} value={escritorio.id}>
                  {escritorio.nome}
                </option>
              ))}
            </select>
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
