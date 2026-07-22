import { useState, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Comarca } from "@/features/crm/types"

interface Props {
  comarca: Comarca | null
  onClose: () => void
}

export function ComarcaFormDialog({ comarca, onClose }: Props) {
  const queryClient = useQueryClient()
  const editando = comarca !== null

  const [nome, setNome] = useState(comarca?.nome ?? "")
  const [uf, setUf] = useState(comarca?.uf ?? "")
  const [tribunal, setTribunal] = useState(comarca?.tribunal ?? "")
  const [erro, setErro] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = { nome, uf: uf.toUpperCase(), tribunal: tribunal || null }
      if (editando) {
        return api.patch(`/comarcas/${comarca.id}`, payload)
      }
      return api.post("/comarcas", payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comarcas"] })
      onClose()
    },
    onError: (err) => {
      setErro(
        isAxiosError(err) ? (err.response?.data?.detail ?? "Falha ao salvar comarca.") : "Falha ao salvar comarca.",
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
        <h2 className="text-lg font-semibold text-foreground">{editando ? "Editar comarca" : "Nova comarca"}</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="uf">UF</Label>
            <Input
              id="uf"
              required
              maxLength={2}
              value={uf}
              onChange={(e) => setUf(e.target.value.toUpperCase())}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tribunal">Tribunal (opcional)</Label>
            <Input id="tribunal" value={tribunal} onChange={(e) => setTribunal(e.target.value)} />
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
