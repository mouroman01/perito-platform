import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Search } from "lucide-react"
import { api } from "@/lib/api"
import { LABEL_TIPO_BUSCA, type ResultadoBusca } from "@/features/busca/types"

export function BuscaGlobal() {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [termo, setTermo] = useState("")
  const [termoDebounced, setTermoDebounced] = useState("")
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setTermoDebounced(termo.trim()), 300)
    return () => clearTimeout(timer)
  }, [termo])

  const habilitado = termoDebounced.length >= 2

  const { data: resultados, isFetching } = useQuery({
    queryKey: ["busca", termoDebounced],
    queryFn: async () => (await api.get<ResultadoBusca[]>("/busca", { params: { q: termoDebounced } })).data,
    enabled: habilitado,
  })

  useEffect(() => {
    function aoClicarFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener("mousedown", aoClicarFora)
    return () => document.removeEventListener("mousedown", aoClicarFora)
  }, [])

  function selecionar(resultado: ResultadoBusca) {
    setAberto(false)
    setTermo("")
    navigate(resultado.url)
  }

  const mostrarDropdown = aberto && habilitado

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1 sm:w-72 sm:flex-none md:w-80">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={termo}
          onChange={(e) => {
            setTermo(e.target.value)
            setAberto(true)
          }}
          onFocus={() => setAberto(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setAberto(false)
          }}
          placeholder="Buscar processos, clientes, advogados..."
          className="h-10 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        />
      </div>

      {mostrarDropdown && (
        <div className="absolute z-50 mt-1 max-h-96 w-full overflow-y-auto rounded-md border border-border bg-card shadow-lg">
          {isFetching && <p className="px-3 py-2 text-sm text-muted-foreground">Buscando...</p>}
          {!isFetching && resultados?.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Nenhum resultado encontrado.</p>
          )}
          {!isFetching &&
            resultados?.map((resultado) => (
              <button
                key={`${resultado.tipo}-${resultado.id}`}
                type="button"
                onClick={() => selecionar(resultado)}
                className="flex w-full flex-col items-start gap-0.5 border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted/60"
              >
                <span className="flex items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {LABEL_TIPO_BUSCA[resultado.tipo]}
                  </span>
                  <span className="font-medium text-foreground">{resultado.titulo}</span>
                </span>
                {resultado.subtitulo && (
                  <span className="text-xs text-muted-foreground">{resultado.subtitulo}</span>
                )}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
