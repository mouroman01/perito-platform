import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { Plus } from "lucide-react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/features/auth/auth-context"
import type { Perfil, Usuario } from "@/features/auth/types"
import { UsuarioFormDialog } from "@/features/usuarios/usuario-form-dialog"

export function UsuariosPage() {
  const { temPermissao } = useAuth()
  const queryClient = useQueryClient()
  const [dialogAberto, setDialogAberto] = useState(false)
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<Usuario | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const podeEscrever = temPermissao("usuarios:write")

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => (await api.get<Usuario[]>("/usuarios")).data,
  })

  const { data: perfis } = useQuery({
    queryKey: ["perfis"],
    queryFn: async () => (await api.get<Perfil[]>("/perfis")).data,
    enabled: podeEscrever,
  })

  const inativarMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/usuarios/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["usuarios"] }),
    onError: (err) => {
      setErro(isAxiosError(err) ? err.response?.data?.detail ?? "Falha ao inativar usuário." : "Falha ao inativar usuário.")
    },
  })

  function abrirCriacao() {
    setUsuarioEmEdicao(null)
    setDialogAberto(true)
  }

  function abrirEdicao(usuario: Usuario) {
    setUsuarioEmEdicao(usuario)
    setDialogAberto(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Usuários</h1>
          <p className="text-sm text-muted-foreground">Controle de acesso e permissões do sistema.</p>
        </div>
        {podeEscrever && (
          <Button onClick={abrirCriacao}>
            <Plus className="size-4" />
            Novo usuário
          </Button>
        )}
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Perfil</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {podeEscrever && <th className="px-4 py-3 font-medium text-right">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            {usuarios?.map((usuario) => (
              <tr key={usuario.id}>
                <td className="px-4 py-3 font-medium text-foreground">{usuario.nome}</td>
                <td className="px-4 py-3 text-muted-foreground">{usuario.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {usuario.perfil.nome}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      usuario.ativo
                        ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700"
                        : "rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700"
                    }
                  >
                    {usuario.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                {podeEscrever && (
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => abrirEdicao(usuario)}>
                        Editar
                      </Button>
                      {usuario.ativo && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => inativarMutation.mutate(usuario.id)}
                          disabled={inativarMutation.isPending}
                        >
                          Inativar
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {dialogAberto && (
        <UsuarioFormDialog
          usuario={usuarioEmEdicao}
          perfis={perfis ?? []}
          onClose={() => setDialogAberto(false)}
        />
      )}
    </div>
  )
}
