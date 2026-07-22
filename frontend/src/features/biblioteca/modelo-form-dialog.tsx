import { useState, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CATEGORIAS_MODELO, type CategoriaModelo, type Modelo } from "@/features/biblioteca/types"

interface Props {
  modelo: Modelo | null
  onClose: () => void
}

export function ModeloFormDialog({ modelo, onClose }: Props) {
  const queryClient = useQueryClient()
  const editando = modelo !== null

  const [nome, setNome] = useState(modelo?.nome ?? "")
  const [categoria, setCategoria] = useState<CategoriaModelo>(modelo?.categoria ?? "laudo")
  const [descricao, setDescricao] = useState(modelo?.descricao ?? "")
  const [conteudo, setConteudo] = useState(modelo?.conteudo ?? "")
  const [erro, setErro] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = { nome, categoria, descricao: descricao || null, conteudo }
      if (editando) {
        return api.patch(`/biblioteca/modelos/${modelo.id}`, payload)
      }
      return api.post("/biblioteca/modelos", payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modelos"] })
      onClose()
    },
    onError: (err) => {
      setErro(
        isAxiosError(err) ? (err.response?.data?.detail ?? "Falha ao salvar modelo.") : "Falha ao salvar modelo.",
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
        <h2 className="text-lg font-semibold text-foreground">{editando ? "Editar modelo" : "Novo modelo"}</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <select
                id="categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaModelo)}
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {CATEGORIAS_MODELO.map((c) => (
                  <option key={c.valor} value={c.valor}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Input id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="conteudo">Conteúdo</Label>
            <Textarea
              id="conteudo"
              required
              rows={10}
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="Use marcadores como {{cliente_nome}}, {{processo_numero}} para variáveis."
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
