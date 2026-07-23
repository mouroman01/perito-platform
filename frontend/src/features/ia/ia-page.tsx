import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { Sparkles } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function IAPage() {
  const [texto, setTexto] = useState("")
  const [resumo, setResumo] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const resumirMutation = useMutation({
    mutationFn: async () => (await api.post<{ resumo: string }>("/ia/resumir", { texto })).data.resumo,
    onSuccess: (r) => {
      setResumo(r)
      setErro(null)
    },
    onError: (err) => {
      setResumo(null)
      setErro(
        isAxiosError(err) ? (err.response?.data?.detail ?? "Falha ao consultar a IA.") : "Falha ao consultar a IA.",
      )
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Inteligência Artificial</h1>
        <p className="text-sm text-muted-foreground">
          Resumo de documentos com IA. Cole um texto (laudo, documento, decisão) e gere um resumo objetivo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumir documento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            rows={12}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Cole aqui o texto a ser resumido (mínimo 20 caracteres)..."
            className="text-sm"
          />
          <div className="flex items-center gap-3">
            <Button
              onClick={() => resumirMutation.mutate()}
              disabled={resumirMutation.isPending || texto.trim().length < 20}
            >
              <Sparkles className="size-4" />
              {resumirMutation.isPending ? "Resumindo..." : "Resumir com IA"}
            </Button>
            <span className="text-xs text-muted-foreground">{texto.length} caracteres</span>
          </div>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
        </CardContent>
      </Card>

      {resumo && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-foreground">{resumo}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
