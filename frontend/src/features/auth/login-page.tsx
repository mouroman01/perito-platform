import { useState, type FormEvent } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { isAxiosError } from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/features/auth/auth-context"

export function LoginPage() {
  const { usuario, carregando, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const senhaRedefinida = (location.state as { senhaRedefinida?: boolean } | null)?.senhaRedefinida

  if (!carregando && usuario) {
    const destino = (location.state as { from?: string } | null)?.from ?? "/dashboard"
    return <Navigate to={destino} replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      await login(email, senha)
      navigate("/dashboard", { replace: true })
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 401) {
        setErro("E-mail ou senha inválidos.")
      } else if (isAxiosError(err) && err.response?.status === 403) {
        setErro("Usuário inativo. Contate o administrador.")
      } else if (isAxiosError(err) && err.response?.status === 429) {
        setErro(err.response.data?.detail ?? "Muitas tentativas de login. Tente novamente em alguns minutos.")
      } else {
        setErro("Não foi possível conectar ao servidor. Tente novamente.")
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Perito OS</CardTitle>
          <CardDescription>Entre com suas credenciais para acessar o sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="senha">Senha</Label>
                <Link to="/esqueci-senha" className="text-xs text-primary hover:underline">
                  Esqueci minha senha
                </Link>
              </div>
              <Input
                id="senha"
                type="password"
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            {senhaRedefinida && !erro && (
              <p className="text-sm text-emerald-600">Senha redefinida com sucesso. Entre com a nova senha.</p>
            )}
            {erro && <p className="text-sm text-destructive">{erro}</p>}
            <Button type="submit" className="w-full" disabled={enviando}>
              {enviando ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
