import { useState } from "react"
import { Link } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { RefreshCw, Search, Sparkles } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function mensagemErro(err: unknown): string {
  return isAxiosError(err) ? (err.response?.data?.detail ?? "Falha ao consultar a IA.") : "Falha ao consultar a IA."
}

type Extracao = {
  partes: string[]
  valores: string[]
  datas: string[]
  documentos: string[]
  quesitos: string[]
  objeto: string
}

function ResumirCard() {
  const [texto, setTexto] = useState("")
  const [resumo, setResumo] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => (await api.post<{ resumo: string }>("/ia/resumir", { texto })).data.resumo,
    onSuccess: (r) => {
      setResumo(r)
      setErro(null)
    },
    onError: (err) => {
      setResumo(null)
      setErro(mensagemErro(err))
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumir documento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          rows={10}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Cole aqui o texto a ser resumido (mínimo 20 caracteres)..."
          className="text-sm"
        />
        <div className="flex items-center gap-3">
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || texto.trim().length < 20}>
            <Sparkles className="size-4" />
            {mutation.isPending ? "Resumindo..." : "Resumir com IA"}
          </Button>
          <span className="text-xs text-muted-foreground">{texto.length} caracteres</span>
        </div>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
        {resumo && <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm text-foreground">{resumo}</p>}
      </CardContent>
    </Card>
  )
}

function ExtrairCard() {
  const [texto, setTexto] = useState("")
  const [dados, setDados] = useState<Extracao | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => (await api.post<Extracao>("/ia/extrair", { texto })).data,
    onSuccess: (d) => {
      setDados(d)
      setErro(null)
    },
    onError: (err) => {
      setDados(null)
      setErro(mensagemErro(err))
    },
  })

  const grupos: { titulo: string; itens: string[] }[] = dados
    ? [
        { titulo: "Partes", itens: dados.partes },
        { titulo: "Valores", itens: dados.valores },
        { titulo: "Datas", itens: dados.datas },
        { titulo: "Documentos (CPF/CNPJ)", itens: dados.documentos },
        { titulo: "Quesitos", itens: dados.quesitos },
      ]
    : []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extrair informações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          rows={10}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Cole uma petição, decisão ou documento para extrair partes, valores, datas, documentos e quesitos..."
          className="text-sm"
        />
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || texto.trim().length < 20}>
          <Sparkles className="size-4" />
          {mutation.isPending ? "Extraindo..." : "Extrair com IA"}
        </Button>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
        {dados && (
          <div className="space-y-3 rounded-md bg-muted p-3 text-sm">
            {dados.objeto && (
              <p>
                <span className="font-medium text-foreground">Objeto:</span>{" "}
                <span className="text-muted-foreground">{dados.objeto}</span>
              </p>
            )}
            {grupos.map((g) => (
              <div key={g.titulo}>
                <p className="font-medium text-foreground">{g.titulo}</p>
                {g.itens.length ? (
                  <ul className="ml-4 list-disc text-muted-foreground">
                    {g.itens.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">—</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ChecklistCard() {
  const [contexto, setContexto] = useState("")
  const [itens, setItens] = useState<string[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => (await api.post<{ itens: string[] }>("/ia/checklist", { contexto })).data.itens,
    onSuccess: (i) => {
      setItens(i)
      setErro(null)
    },
    onError: (err) => {
      setItens(null)
      setErro(mensagemErro(err))
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Checklist automático do laudo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          rows={6}
          value={contexto}
          onChange={(e) => setContexto(e.target.value)}
          placeholder="Descreva o processo/perícia (especialidade, objeto, quesitos) para gerar o checklist..."
          className="text-sm"
        />
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || contexto.trim().length < 10}>
          <Sparkles className="size-4" />
          {mutation.isPending ? "Gerando..." : "Gerar checklist"}
        </Button>
        {erro && <p className="text-sm text-destructive">{erro}</p>}
        {itens && (
          <ul className="space-y-1 rounded-md bg-muted p-3 text-sm text-foreground">
            {itens.map((item, i) => (
              <li key={i} className="flex gap-2">
                <input type="checkbox" className="mt-1" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

type ResultadoSemantico = {
  tipo: string
  id: number
  processo_id: number | null
  titulo: string
  score: number
  snippet: string
  url: string
}

const LABEL_TIPO: Record<string, string> = { laudo: "Laudo", evidencia: "Evidência", documento: "Documento" }

function PesquisaSemanticaCard() {
  const [consulta, setConsulta] = useState("")
  const [resultados, setResultados] = useState<ResultadoSemantico[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [indexInfo, setIndexInfo] = useState<string | null>(null)

  const reindexMutation = useMutation({
    mutationFn: async () =>
      (await api.post<{ indexados: number }>("/ia/pesquisa-semantica/reindexar")).data.indexados,
    onSuccess: (n) => {
      setIndexInfo(`${n} ${n === 1 ? "item indexado" : "itens indexados"}.`)
      setErro(null)
    },
    onError: (err) => setErro(mensagemErro(err)),
  })

  const buscaMutation = useMutation({
    mutationFn: async () =>
      (await api.post<{ resultados: ResultadoSemantico[] }>("/ia/pesquisa-semantica", { consulta })).data.resultados,
    onSuccess: (r) => {
      setResultados(r)
      setErro(null)
    },
    onError: (err) => {
      setResultados(null)
      setErro(mensagemErro(err))
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pesquisa semântica</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Busca por significado (não por palavra exata) em laudos, evidências e documentos, usando embeddings. Reindexe
          após cadastrar novos itens.
        </p>
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
            placeholder="Ex.: infiltração no telhado, atraso na entrega do laudo..."
          />
          <Button type="submit" disabled={buscaMutation.isPending || consulta.trim().length < 3}>
            <Search className="size-4" />
            {buscaMutation.isPending ? "Buscando..." : "Buscar"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => reindexMutation.mutate()}
            disabled={reindexMutation.isPending}
            title="Reconstruir o índice de embeddings"
          >
            <RefreshCw className="size-4" />
            {reindexMutation.isPending ? "Indexando..." : "Reindexar"}
          </Button>
        </form>
        {indexInfo && <p className="text-xs text-muted-foreground">{indexInfo}</p>}
        {erro && <p className="text-sm text-destructive">{erro}</p>}
        {resultados && resultados.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum resultado. Já reindexou o acervo?</p>
        )}
        {resultados && resultados.length > 0 && (
          <ul className="divide-y divide-border">
            {resultados.map((r) => (
              <li key={`${r.tipo}-${r.id}`} className="py-2">
                <div className="flex items-center justify-between gap-2">
                  <Link to={r.url} className="font-medium text-foreground hover:underline">
                    {r.titulo}
                  </Link>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {LABEL_TIPO[r.tipo] ?? r.tipo} · {(r.score * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{r.snippet}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function IAPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Inteligência Artificial</h1>
        <p className="text-sm text-muted-foreground">
          Recursos assistidos por IA: resumo de documentos, extração de informações, checklist de laudo e pesquisa
          semântica. A busca inteligente e a organização de evidências ficam dentro de cada processo.
        </p>
      </div>

      <PesquisaSemanticaCard />
      <ResumirCard />
      <ExtrairCard />
      <ChecklistCard />
    </div>
  )
}
