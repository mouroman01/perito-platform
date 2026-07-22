import { useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { ArrowLeft, Download, Plus, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import { formatarDataLocal } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/features/auth/auth-context"
import {
  MIDIAS_ORIGEM_EVIDENCIA,
  SITUACOES_PROCESSO,
  TIPOS_EVIDENCIA,
  type Documento,
  type Evidencia,
  type MidiaOrigemEvidencia,
  type Processo,
  type TipoEvidencia,
} from "@/features/processos/types"
import type { Compromisso, TipoCompromisso } from "@/features/agenda/types"
import { TIPOS_COMPROMISSO } from "@/features/agenda/types"
import { STATUS_LAUDO, type Laudo } from "@/features/laudos/types"
import { LaudoFormDialog } from "@/features/laudos/laudo-form-dialog"
import { HistoricoCard } from "@/features/historico/historico-card"

const LABEL_STATUS_LAUDO = Object.fromEntries(STATUS_LAUDO.map((s) => [s.valor, s.label]))
const LABEL_SITUACAO_PROCESSO = Object.fromEntries(SITUACOES_PROCESSO.map((s) => [s.valor, s.label]))
const LABEL_TIPO_EVIDENCIA = Object.fromEntries(TIPOS_EVIDENCIA.map((t) => [t.valor, t.label]))
const LABEL_MIDIA_ORIGEM = Object.fromEntries(MIDIAS_ORIGEM_EVIDENCIA.map((m) => [m.valor, m.label]))

function formatarBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ProcessoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const processoId = Number(id)
  const { temPermissao } = useAuth()
  const queryClient = useQueryClient()
  const podeEscrever = temPermissao("processos:write")
  const podeAgendar = temPermissao("agenda:write")
  const podeLaudar = temPermissao("laudos:write")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const evidenciaFileInputRef = useRef<HTMLInputElement>(null)

  const [erro, setErro] = useState<string | null>(null)
  const [tipoEvidencia, setTipoEvidencia] = useState<TipoEvidencia>("foto")
  const [midiaOrigemEvidencia, setMidiaOrigemEvidencia] = useState<MidiaOrigemEvidencia | "">("")
  const [descricaoEvidencia, setDescricaoEvidencia] = useState("")
  const [dialogLaudoAberto, setDialogLaudoAberto] = useState(false)
  const [novoCompromisso, setNovoCompromisso] = useState({
    titulo: "",
    tipo: "diligencia" as TipoCompromisso,
    data_hora: "",
    local: "",
  })

  const { data: processo, isLoading } = useQuery({
    queryKey: ["processos", processoId],
    queryFn: async () => (await api.get<Processo>(`/processos/${processoId}`)).data,
  })

  const { data: documentos } = useQuery({
    queryKey: ["documentos", processoId],
    queryFn: async () => (await api.get<Documento[]>(`/processos/${processoId}/documentos`)).data,
  })

  const { data: evidencias } = useQuery({
    queryKey: ["evidencias", processoId],
    queryFn: async () => (await api.get<Evidencia[]>(`/processos/${processoId}/evidencias`)).data,
  })

  const { data: compromissos } = useQuery({
    queryKey: ["agenda", { processoId }],
    queryFn: async () => (await api.get<Compromisso[]>("/agenda", { params: { processo_id: processoId } })).data,
  })

  const { data: laudos } = useQuery({
    queryKey: ["laudos", { processoId }],
    queryFn: async () => (await api.get<Laudo[]>("/laudos", { params: { processo_id: processoId } })).data,
  })

  const situacaoMutation = useMutation({
    mutationFn: (situacao: string) => api.patch(`/processos/${processoId}`, { situacao }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processos", processoId] })
      queryClient.invalidateQueries({ queryKey: ["historico", "processos", processoId] })
    },
  })

  const uploadMutation = useMutation({
    mutationFn: (arquivo: File) => {
      const formData = new FormData()
      formData.append("arquivo", arquivo)
      return api.post(`/processos/${processoId}/documentos`, formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos", processoId] })
      if (fileInputRef.current) fileInputRef.current.value = ""
    },
    onError: (err) => {
      setErro(
        isAxiosError(err) ? (err.response?.data?.detail ?? "Falha ao enviar documento.") : "Falha ao enviar documento.",
      )
    },
  })

  const removerDocumentoMutation = useMutation({
    mutationFn: (documentoId: number) => api.delete(`/documentos/${documentoId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documentos", processoId] }),
  })

  const uploadEvidenciaMutation = useMutation({
    mutationFn: (arquivo: File) => {
      const formData = new FormData()
      formData.append("arquivo", arquivo)
      formData.append("tipo", tipoEvidencia)
      if (midiaOrigemEvidencia) formData.append("midia_origem", midiaOrigemEvidencia)
      if (descricaoEvidencia) formData.append("descricao", descricaoEvidencia)
      return api.post(`/processos/${processoId}/evidencias`, formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evidencias", processoId] })
      setDescricaoEvidencia("")
      if (evidenciaFileInputRef.current) evidenciaFileInputRef.current.value = ""
    },
    onError: (err) => {
      setErro(
        isAxiosError(err)
          ? (err.response?.data?.detail ?? "Falha ao enviar evidência.")
          : "Falha ao enviar evidência.",
      )
    },
  })

  const removerEvidenciaMutation = useMutation({
    mutationFn: (evidenciaId: number) => api.delete(`/evidencias/${evidenciaId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["evidencias", processoId] }),
  })

  const criarCompromissoMutation = useMutation({
    mutationFn: () =>
      api.post("/agenda", {
        titulo: novoCompromisso.titulo,
        tipo: novoCompromisso.tipo,
        data_hora: new Date(novoCompromisso.data_hora).toISOString(),
        local: novoCompromisso.local || null,
        processo_id: processoId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda", { processoId }] })
      setNovoCompromisso({ titulo: "", tipo: "diligencia", data_hora: "", local: "" })
    },
    onError: (err) => {
      setErro(
        isAxiosError(err)
          ? (err.response?.data?.detail ?? "Falha ao criar compromisso.")
          : "Falha ao criar compromisso.",
      )
    },
  })

  const concluirCompromissoMutation = useMutation({
    mutationFn: ({ compromissoId, concluido }: { compromissoId: number; concluido: boolean }) =>
      api.patch(`/agenda/${compromissoId}`, { concluido }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agenda", { processoId }] }),
  })

  async function baixarDocumento(documento: Documento) {
    const resposta = await api.get(`/documentos/${documento.id}/download`, { responseType: "blob" })
    const url = URL.createObjectURL(resposta.data)
    const link = document.createElement("a")
    link.href = url
    link.download = documento.nome_original
    link.click()
    URL.revokeObjectURL(url)
  }

  async function baixarEvidencia(evidencia: Evidencia) {
    const resposta = await api.get(`/evidencias/${evidencia.id}/download`, { responseType: "blob" })
    const url = URL.createObjectURL(resposta.data)
    const link = document.createElement("a")
    link.href = url
    link.download = evidencia.nome_original
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading || !processo) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  return (
    <div className="space-y-6">
      <Link to="/processos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        Voltar para processos
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{processo.numero}</h1>
          <p className="text-sm text-muted-foreground">
            {processo.comarca.nome}/{processo.comarca.uf}
            {processo.magistrado && ` · ${processo.magistrado.nome}`}
            {processo.cliente && ` · ${processo.cliente.nome}`}
          </p>
        </div>
        {podeEscrever && (
          <select
            value={processo.situacao}
            onChange={(e) => situacaoMutation.mutate(e.target.value)}
            className="h-10 rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            {SITUACOES_PROCESSO.map((s) => (
              <option key={s.valor} value={s.valor}>
                {s.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Especialidade: </span>
              {processo.especialidade ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Prazo: </span>
              {processo.prazo ? formatarDataLocal(processo.prazo) : "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Partes: </span>
              {processo.partes ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Objeto: </span>
              {processo.objeto ?? "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {podeEscrever && (
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => {
                    const arquivo = e.target.files?.[0]
                    if (arquivo) uploadMutation.mutate(arquivo)
                  }}
                  className="text-sm"
                />
                {uploadMutation.isPending && (
                  <span className="text-xs text-muted-foreground">Enviando...</span>
                )}
              </div>
            )}
            <ul className="divide-y divide-border text-sm">
              {documentos?.length === 0 && <li className="py-2 text-muted-foreground">Nenhum documento.</li>}
              {documentos?.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-foreground">{doc.nome_original}</p>
                    <p className="text-xs text-muted-foreground">{formatarBytes(doc.tamanho_bytes)}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => baixarDocumento(doc)}>
                      <Download className="size-4" />
                    </Button>
                    {podeEscrever && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removerDocumentoMutation.mutate(doc.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evidências</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {podeEscrever && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[8rem_8rem_1fr_auto] sm:items-end">
              <div className="space-y-1">
                <Label htmlFor="tipo-evidencia">Tipo</Label>
                <select
                  id="tipo-evidencia"
                  value={tipoEvidencia}
                  onChange={(e) => setTipoEvidencia(e.target.value as TipoEvidencia)}
                  className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {TIPOS_EVIDENCIA.map((t) => (
                    <option key={t.valor} value={t.valor}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="midia-origem">Mídia de origem</Label>
                <select
                  id="midia-origem"
                  value={midiaOrigemEvidencia}
                  onChange={(e) => setMidiaOrigemEvidencia(e.target.value as MidiaOrigemEvidencia | "")}
                  className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <option value="">—</option>
                  {MIDIAS_ORIGEM_EVIDENCIA.map((m) => (
                    <option key={m.valor} value={m.valor}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="descricao-evidencia">Descrição</Label>
                <Input
                  id="descricao-evidencia"
                  value={descricaoEvidencia}
                  onChange={(e) => setDescricaoEvidencia(e.target.value)}
                  placeholder="Ex.: fotos do local da perícia"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={evidenciaFileInputRef}
                  type="file"
                  onChange={(e) => {
                    const arquivo = e.target.files?.[0]
                    if (arquivo) uploadEvidenciaMutation.mutate(arquivo)
                  }}
                  className="text-sm"
                />
                {uploadEvidenciaMutation.isPending && (
                  <span className="text-xs text-muted-foreground">Enviando...</span>
                )}
              </div>
            </div>
          )}
          <ul className="divide-y divide-border text-sm">
            {evidencias?.length === 0 && <li className="py-2 text-muted-foreground">Nenhuma evidência.</li>}
            {evidencias?.map((ev) => (
              <li key={ev.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{ev.nome_original}</p>
                  <p className="text-xs text-muted-foreground">
                    {LABEL_TIPO_EVIDENCIA[ev.tipo]}
                    {ev.midia_origem && ` · ${LABEL_MIDIA_ORIGEM[ev.midia_origem]}`}
                    {` · ${formatarBytes(ev.tamanho_bytes)}`}
                    {ev.responsavel && ` · ${ev.responsavel.nome}`}
                  </p>
                  {ev.descricao && <p className="text-xs text-muted-foreground">{ev.descricao}</p>}
                  <p
                    className="truncate text-xs text-muted-foreground/70"
                    title={`SHA-256: ${ev.hash_sha256}`}
                  >
                    hash: {ev.hash_sha256.slice(0, 16)}…
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="sm" onClick={() => baixarEvidencia(ev)}>
                    <Download className="size-4" />
                  </Button>
                  {podeEscrever && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removerEvidenciaMutation.mutate(ev.id)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agenda do processo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {podeAgendar && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                criarCompromissoMutation.mutate()
              }}
              className="grid grid-cols-1 gap-2 sm:grid-cols-5 sm:items-end"
            >
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  required
                  value={novoCompromisso.titulo}
                  onChange={(e) => setNovoCompromisso((s) => ({ ...s, titulo: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tipo">Tipo</Label>
                <select
                  id="tipo"
                  value={novoCompromisso.tipo}
                  onChange={(e) =>
                    setNovoCompromisso((s) => ({ ...s, tipo: e.target.value as TipoCompromisso }))
                  }
                  className="flex h-10 w-full rounded-md border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  {TIPOS_COMPROMISSO.map((t) => (
                    <option key={t.valor} value={t.valor}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="data_hora">Data/hora</Label>
                <Input
                  id="data_hora"
                  type="datetime-local"
                  required
                  value={novoCompromisso.data_hora}
                  onChange={(e) => setNovoCompromisso((s) => ({ ...s, data_hora: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Local"
                  value={novoCompromisso.local}
                  onChange={(e) => setNovoCompromisso((s) => ({ ...s, local: e.target.value }))}
                />
                <Button type="submit" disabled={criarCompromissoMutation.isPending}>
                  Adicionar
                </Button>
              </div>
            </form>
          )}

          <ul className="divide-y divide-border text-sm">
            {compromissos?.length === 0 && <li className="py-2 text-muted-foreground">Nenhum compromisso.</li>}
            {compromissos?.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2">
                <div className={c.concluido ? "opacity-50" : ""}>
                  <p className="font-medium text-foreground">{c.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.data_hora).toLocaleString("pt-BR")}
                    {c.local && ` · ${c.local}`}
                  </p>
                </div>
                {podeAgendar && (
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={c.concluido}
                      onChange={(e) =>
                        concluirCompromissoMutation.mutate({ compromissoId: c.id, concluido: e.target.checked })
                      }
                    />
                    Concluído
                  </label>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Laudos</CardTitle>
          {podeLaudar && (
            <Button size="sm" onClick={() => setDialogLaudoAberto(true)}>
              <Plus className="size-4" />
              Novo laudo
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border text-sm">
            {laudos?.length === 0 && <li className="py-2 text-muted-foreground">Nenhum laudo.</li>}
            {laudos?.map((laudo) => (
              <li key={laudo.id} className="flex items-center justify-between py-2">
                <Link to={`/laudos/${laudo.id}`} className="font-medium text-foreground hover:underline">
                  {laudo.titulo}
                </Link>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {LABEL_STATUS_LAUDO[laudo.status]}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {dialogLaudoAberto && (
        <LaudoFormDialog processoId={processoId} onClose={() => setDialogLaudoAberto(false)} />
      )}

      <HistoricoCard
        entidade="processos"
        entidadeId={processoId}
        traduzirValor={(campo, valor) => {
          if (campo === "situacao" && valor) return LABEL_SITUACAO_PROCESSO[valor] ?? valor
          if (campo === "prazo" && valor) return formatarDataLocal(valor)
          return valor ?? "—"
        }}
      />
    </div>
  )
}
