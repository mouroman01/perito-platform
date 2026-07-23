import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { Search, Sparkles } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/features/auth/auth-context"

function mensagemErro(err: unknown): string {
  return isAxiosError(err) ? (err.response?.data?.detail ?? "Falha ao consultar a IA.") : "Falha ao consultar a IA."
}

export function AssistenteIaProcesso({ processoId }: { processoId: number }) {
  const { temPermissao } = useAuth()
  const [consulta, setConsulta] = useState("")
  const [respostaBusca, setRespostaBusca] = useState<string | null>(null)
  const [erroBusca, setErroBusca] = useState<string | null>(null)
  const [organizacao, setOrganizacao] = useState<string | null>(null)
  const [erroOrg, setErroOrg] = useState<string | null>(null)

  const buscaMutation = useMutation({
    mutationFn: async () =>
      (await api.post<{ resposta: string }>("/ia/busca-inteligente", { processo_id: processoId, consulta })).data
        .resposta,
    onSuccess: (r) => {
      setRespostaBusca(r)
      setErroBusca(null)
    },
    onError: (err) => {
      setRespostaBusca(null)
      setErroBusca(mensagemErro(err))
    },
  })

  const organizarMutation = useMutation({
    mutationFn: async () =>
      (await api.post<{ organizacao: string }>("/ia/organizar-evidencias", { processo_id: processoId })).data
        .organizacao,
    onSuccess: (o) => {
      setOrganizacao(o)
      setErroOrg(null)
    },
    onError: (err) => {
      setOrganizacao(null)
      setErroOrg(mensagemErro(err))
    },
  })

  if (!temPermissao("ia:usar")) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          Assistente de IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Busca inteligente</p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              buscaMutation.mutate()
            }}
            className="flex gap-2"
          >
            <Input
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              placeholder="Ex.: já existe laudo finalizado? há foto do local?"
            />
            <Button type="submit" disabled={buscaMutation.isPending || consulta.trim().length < 3}>
              <Search className="size-4" />
              {buscaMutation.isPending ? "Buscando..." : "Buscar"}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground">
            Pesquisa em linguagem natural sobre documentos, evidências e laudos deste processo.
          </p>
          {erroBusca && <p className="text-sm text-destructive">{erroBusca}</p>}
          {respostaBusca && (
            <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm text-foreground">{respostaBusca}</p>
          )}
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-sm font-medium text-foreground">Organização de evidências</p>
          <Button
            variant="outline"
            onClick={() => organizarMutation.mutate()}
            disabled={organizarMutation.isPending}
          >
            <Sparkles className="size-4" />
            {organizarMutation.isPending ? "Analisando..." : "Sugerir organização (IA)"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Agrupamento, linha do tempo e notas de cadeia de custódia a partir das evidências cadastradas.
          </p>
          {erroOrg && <p className="text-sm text-destructive">{erroOrg}</p>}
          {organizacao && (
            <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm text-foreground">{organizacao}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
