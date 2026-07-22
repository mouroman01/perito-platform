import { useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Processo } from "@/features/processos/types"
import { TIPOS_IMPOSTO, type TipoImposto, type TipoLancamento } from "@/features/financeiro/types"

interface Props {
  onClose: () => void
}

export function LancamentoFormDialog({ onClose }: Props) {
  const queryClient = useQueryClient()

  const [tipo, setTipo] = useState<TipoLancamento>("entrada")
  const [descricao, setDescricao] = useState("")
  const [valor, setValor] = useState("")
  const [vencimento, setVencimento] = useState("")
  const [processoId, setProcessoId] = useState<number | "">("")
  const [tipoImposto, setTipoImposto] = useState<TipoImposto | "">("")
  const [competencia, setCompetencia] = useState("")
  const [erro, setErro] = useState<string | null>(null)

  const { data: processos } = useQuery({
    queryKey: ["processos"],
    queryFn: async () => (await api.get<Processo[]>("/processos")).data,
  })

  const mutation = useMutation({
    mutationFn: async () =>
      api.post("/financeiro", {
        tipo,
        descricao,
        valor,
        vencimento,
        processo_id: processoId || null,
        tipo_imposto: tipoImposto || null,
        competencia: tipoImposto && competencia ? `${competencia}-01` : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financeiro"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-kpis"] })
      onClose()
    },
    onError: (err) => {
      setErro(
        isAxiosError(err)
          ? (err.response?.data?.detail ?? "Falha ao salvar lançamento.")
          : "Falha ao salvar lançamento.",
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
        <h2 className="text-lg font-semibold text-foreground">Novo lançamento</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <select
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoLancamento)}
              className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input id="descricao" required value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vencimento">Vencimento</Label>
              <Input
                id="vencimento"
                type="date"
                required
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
              />
            </div>
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="tipo-imposto">Tipo de imposto (opcional)</Label>
              <select
                id="tipo-imposto"
                value={tipoImposto}
                onChange={(e) => setTipoImposto(e.target.value as TipoImposto | "")}
                className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <option value="">Nenhum</option>
                {TIPOS_IMPOSTO.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            {tipoImposto && (
              <div className="space-y-2">
                <Label htmlFor="competencia">Competência</Label>
                <Input
                  id="competencia"
                  type="month"
                  value={competencia}
                  onChange={(e) => setCompetencia(e.target.value)}
                />
              </div>
            )}
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
