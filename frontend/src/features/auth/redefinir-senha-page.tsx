import { useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { isAxiosError } from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"

export function RedefinirSenhaPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const navigate = useNavigate()

  const [novaSenha, setNovaSenha] = useState("")
  const [confirmacao, setConfirmacao] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)

    if (novaSenha !== confirmacao) {
      setErro("As senhas não coincidem.")
      return
    }

    setEnviando(true)
    try {
      await api.post("/auth/redefinir-senha", { token, nova_senha: novaSenha })
      navigate("/login", { state: { senhaRedefinida: true } })
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 400) {
        setErro("Link inválido ou expirado. Solicite um novo link de redefinição.")
      } else {
        setErro("Não foi possível redefinir a senha. Tente novamente.")
      }
    } finally {
      setEnviando(false)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-primary">Link inválido</CardTitle>
            <CardDescription>Este link de redefinição de senha está incompleto.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/esqueci-senha" className="text-sm text-primary hover:underline">
              Solicitar novo link
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Redefinir senha</CardTitle>
          <CardDescription>Escolha uma nova senha para sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova senha</Label>
              <Input
                id="novaSenha"
                type="password"
                minLength={8}
                required
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmacao">Confirmar nova senha</Label>
              <Input
                id="confirmacao"
                type="password"
                minLength={8}
                required
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
              />
            </div>
            {erro && <p className="text-sm text-destructive">{erro}</p>}
            <Button type="submit" className="w-full" disabled={enviando}>
              {enviando ? "Salvando..." : "Redefinir senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
