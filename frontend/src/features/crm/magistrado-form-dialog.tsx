import { useState, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Comarca, Magistrado } from "@/features/crm/types"

interface Props {
  magistrado: Magistrado | null
  comarcas: Comarca[]
  onClose: () => void
}

export function MagistradoFormDialog({ magistrado, comarcas, onClose }: Props) {
  const queryClient = useQueryClient()
  const editando = magistrado !== null

  const [nome, setNome] = useState(magistrado?.nome ?? "")
  const [cargo, setCargo] = useState(magistrado?.cargo ?? "")
  const [vara, setVara] = useState(magistrado?.vara ?? "")
  const [email, setEmail] = useState(magistrado?.email ?? "")
  const [telefone, setTelefone] = useState(magistrado?.telefone ?? "")
  const [comarcaId, setComarcaId] = useState<number | "">(magistrado?.comarca.id ?? "")
  const [erro, setErro] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nome,
        cargo: cargo || null,
        vara: vara || null,
        email: email || null,
        telefone: telefone || null,
        comarca_id: comarcaId || undefined,
      }
      if (editando) {
        return api.patch(`/magistrados/${magistrado.id}`, payload)
      }
      return api.post("/magistrados", payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["magistrados"] })
      onClose()
    },
    onError: (err) => {
      setErro(
        isAxiosError(err)
          ? (err.response?.data?.detail ?? "Falha ao salvar magistrado.")
          : "Falha ao salvar magistrado.",
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
          {editando ? "Editar magistrado" : "Novo magistrado"}
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
              <Label htmlFor="vara">Vara</Label>
              <Input id="vara" value={vara} onChange={(e) => setVara(e.target.value)} />
            </div>
          </div>
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
                Selecione uma comarca
              </option>
              {comarcas.map((comarca) => (
                <option key={comarca.id} value={comarca.id}>
                  {comarca.nome}/{comarca.uf}
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
