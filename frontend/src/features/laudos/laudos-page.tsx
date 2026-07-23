import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/features/auth/auth-context"
import { STATUS_LAUDO, type Laudo } from "@/features/laudos/types"
import { LaudoFormDialog } from "@/features/laudos/laudo-form-dialog"

const LABEL_STATUS = Object.fromEntries(STATUS_LAUDO.map((s) => [s.valor, s.label]))

const COR_STATUS: Record<string, string> = {
  rascunho: "bg-muted text-muted-foreground",
  em_revisao: "bg-amber-100 text-amber-700",
  finalizado: "bg-blue-100 text-blue-700",
  entregue: "bg-emerald-100 text-emerald-700",
}

export function LaudosPage() {
  const { temPermissao } = useAuth()
  const [dialogAberto, setDialogAberto] = useState(false)

  const podeEscrever = temPermissao("laudos:write")

  const { data: laudos, isLoading } = useQuery({
    queryKey: ["laudos"],
    queryFn: async () => (await api.get<Laudo[]>("/laudos")).data,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {podeEscrever && (
          <Button onClick={() => setDialogAberto(true)}>
            <Plus className="size-4" />
            Novo laudo
          </Button>
        )}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Título</th>
              <th className="px-4 py-3 font-medium">Processo</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {laudos?.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                  Nenhum laudo cadastrado.
                </td>
              </tr>
            )}
            {laudos?.map((laudo) => (
              <tr key={laudo.id}>
                <td className="px-4 py-3 font-medium text-foreground">
                  <Link to={`/laudos/${laudo.id}`} className="hover:underline">
                    {laudo.titulo}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <Link to={`/processos/${laudo.processo.id}`} className="hover:underline">
                    {laudo.processo.numero}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${COR_STATUS[laudo.status]}`}>
                    {LABEL_STATUS[laudo.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {dialogAberto && <LaudoFormDialog onClose={() => setDialogAberto(false)} />}
    </div>
  )
}
