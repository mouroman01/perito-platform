import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatarDataLocal } from "@/lib/utils"
import { labelCampo, type HistoricoAlteracao } from "@/features/historico/types"

interface Props {
  entidade: string
  entidadeId: number
  traduzirValor?: (campo: string, valor: string | null) => string
}

function valorPadrao(valor: string | null) {
  if (valor === null || valor === "") return "—"
  // Datas no formato YYYY-MM-DD ficam mais legíveis como DD/MM/AAAA
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return formatarDataLocal(valor)
  return valor
}

export function HistoricoCard({ entidade, entidadeId, traduzirValor }: Props) {
  const { data: historico, isLoading } = useQuery({
    queryKey: ["historico", entidade, entidadeId],
    queryFn: async () =>
      (
        await api.get<HistoricoAlteracao[]>("/historico", {
          params: { entidade, entidade_id: entidadeId },
        })
      ).data,
  })

  const formatar = (campo: string, valor: string | null) =>
    traduzirValor ? traduzirValor(campo, valor) : valorPadrao(valor)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de alterações</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {historico?.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma alteração registrada ainda.</p>
        )}
        <ul className="divide-y divide-border text-sm">
          {historico?.map((item) => (
            <li key={item.id} className="py-2">
              <p className="text-foreground">
                <span className="font-medium">{labelCampo(item.campo)}</span> alterado de{" "}
                <span className="text-muted-foreground">{formatar(item.campo, item.valor_anterior)}</span> para{" "}
                <span className="font-medium">{formatar(item.campo, item.valor_novo)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {item.usuario?.nome ?? "Sistema"} · {new Date(item.criado_em).toLocaleString("pt-BR")}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
