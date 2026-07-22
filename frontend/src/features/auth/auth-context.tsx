import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { api } from "@/lib/api"
import { authStorage } from "@/lib/auth-storage"
import type { LoginResponse, Usuario } from "@/features/auth/types"

interface AuthContextValue {
  usuario: Usuario | null
  carregando: boolean
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
  temPermissao: (permissao: string) => boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const token = authStorage.getAccessToken()
    if (!token) {
      setCarregando(false)
      return
    }
    api
      .get<Usuario>("/auth/me")
      .then((res) => setUsuario(res.data))
      .catch(() => authStorage.clear())
      .finally(() => setCarregando(false))
  }, [])

  async function login(email: string, senha: string) {
    const params = new URLSearchParams()
    params.set("username", email)
    params.set("password", senha)
    const { data } = await api.post<LoginResponse>("/auth/login", params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
    authStorage.setTokens(data.access_token, data.refresh_token)
    setUsuario(data.usuario)
  }

  function logout() {
    authStorage.clear()
    setUsuario(null)
  }

  function temPermissao(permissao: string) {
    const permissoes = usuario?.perfil.permissoes ?? []
    return permissoes.includes("*") || permissoes.includes(permissao)
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout, temPermissao }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth deve ser usado dentro de um AuthProvider")
  return ctx
}
