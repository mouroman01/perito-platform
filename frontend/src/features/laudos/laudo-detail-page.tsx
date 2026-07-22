import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Download } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/features/auth/auth-context"
import { STATUS_LAUDO, type Laudo } from "@/features/laudos/types"
import { HistoricoCard } from "@/features/historico/historico-card"

const LABEL_STATUS = Object.fromEntries(STATUS_LAUDO.map((s) => [s.valor, s.label]))

export function LaudoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const laudoId = Number(id)
  const { temPermissao } = useAuth()
  const queryClient = useQueryClient()
  const podeEscrever = temPermissao("laudos:write")

  const [conteudo, setConteudo] = useState("")
  const [salvo, setSalvo] = useState(false)

  const { data: laudo, isLoading } = useQuery({
    queryKey: ["laudos", laudoId],
    queryFn: async () => (await api.get<Laudo>(`/laudos/${laudoId}`)).data,
  })

  useEffect(() => {
    if (laudo) setConteudo(laudo.conteudo)
  }, [laudo])

  const salvarMutation = useMutation({
    mutationFn: () => api.patch(`/laudos/${laudoId}`, { conteudo }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laudos", laudoId] })
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2000)
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/laudos/${laudoId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["laudos", laudoId] })
      queryClient.invalidateQueries({ queryKey: ["historico", "laudos", laudoId] })
    },
  })

  async function baixarPdf() {
    const resposta = await api.get(`/laudos/${laudoId}/exportar-pdf`, { responseType: "blob" })
    const url = URL.createObjectURL(resposta.data)
    const link = document.createElement("a")
    link.href = url
    link.download = `laudo-${laudoId}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function baixarWord() {
    const resposta = await api.get(`/laudos/${laudoId}/exportar-word`, { responseType: "blob" })
    const url = URL.createObjectURL(resposta.data)
    const link = document.createElement("a")
    link.href = url
    link.download = `laudo-${laudoId}.docx`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading || !laudo) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  return (
    <div className="space-y-6">
      <Link
        to="/biblioteca/laudos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para laudos
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{laudo.titulo}</h1>
          <p className="text-sm text-muted-foreground">
            Processo:{" "}
            <Link to={`/processos/${laudo.processo.id}`} className="hover:underline">
              {laudo.processo.numero}
            </Link>
            {laudo.criado_por && ` · Criado por ${laudo.criado_por.nome}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={baixarPdf}>
            <Download className="size-4" />
            Baixar PDF
          </Button>
          <Button variant="outline" onClick={baixarWord}>
            <Download className="size-4" />
            Baixar Word
          </Button>
          {podeEscrever && (
            <select
              value={laudo.status}
              onChange={(e) => statusMutation.mutate(e.target.value)}
              className="h-10 rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {STATUS_LAUDO.map((s) => (
                <option key={s.valor} value={s.valor}>
                  {s.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Textarea
          rows={22}
          value={conteudo}
          disabled={!podeEscrever}
          onChange={(e) => setConteudo(e.target.value)}
          className="font-mono text-sm"
        />
        {podeEscrever && (
          <div className="flex items-center gap-3">
            <Button onClick={() => salvarMutation.mutate()} disabled={salvarMutation.isPending}>
              {salvarMutation.isPending ? "Salvando..." : "Salvar conteúdo"}
            </Button>
            {salvo && <span className="text-sm text-emerald-600">Salvo.</span>}
          </div>
        )}
      </div>

      <HistoricoCard
        entidade="laudos"
        entidadeId={laudoId}
        traduzirValor={(campo, valor) => {
          if (campo === "status" && valor) return LABEL_STATUS[valor] ?? valor
          return valor ?? "—"
        }}
      />
    </div>
  )
}
