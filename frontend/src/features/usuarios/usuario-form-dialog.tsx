import { useState, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Perfil, Usuario } from "@/features/auth/types"

interface Props {
  usuario: Usuario | null
  perfis: Perfil[]
  onClose: () => void
}

export function UsuarioFormDialog({ usuario, perfis, onClose }: Props) {
  const queryClient = useQueryClient()
  const editando = usuario !== null

  const [nome, setNome] = useState(usuario?.nome ?? "")
  const [email, setEmail] = useState(usuario?.email ?? "")
  const [senha, setSenha] = useState("")
  const [perfilId, setPerfilId] = useState<number | "">(usuario?.perfil.id ?? "")
  const [erro, setErro] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      if (editando) {
        return api.patch(`/usuarios/${usuario.id}`, {
          nome,
          perfil_id: perfilId || undefined,
          ...(senha ? { senha } : {}),
        })
      }
      return api.post("/usuarios", { nome, email, senha, perfil_id: perfilId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] })
      onClose()
    },
    onError: (err) => {
      setErro(isAxiosError(err) ? err.response?.data?.detail ?? "Falha ao salvar usuário." : "Falha ao salvar usuário.")
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    mutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-foreground">
          {editando ? "Editar usuário" : "Novo usuário"}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              required
              disabled={editando}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="perfil">Perfil</Label>
            <select
              id="perfil"
              required
              value={perfilId}
              onChange={(e) => setPerfilId(Number(e.target.value))}
              className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <option value="" disabled>
                Selecione um perfil
              </option>
              {perfis.map((perfil) => (
                <option key={perfil.id} value={perfil.id}>
                  {perfil.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha">{editando ? "Nova senha (opcional)" : "Senha"}</Label>
            <Input
              id="senha"
              type="password"
              minLength={8}
              required={!editando}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          {erro && <p className="text-sm text-destructive">{erro}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
