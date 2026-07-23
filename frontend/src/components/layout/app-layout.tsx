import { useState } from "react"
import { NavLink, Outlet } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Wallet,
  Calendar,
  BookOpen,
  FileText,
  Sparkles,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/features/auth/auth-context"
import { BuscaGlobal } from "@/features/busca/busca-global"
import { BotaoTema } from "@/features/tema/botao-tema"

const itensNavegacao = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, disponivel: true },
  { to: "/crm", label: "CRM", icon: Briefcase, disponivel: true },
  { to: "/processos", label: "Processos", icon: FileText, disponivel: true },
  { to: "/financeiro", label: "Financeiro", icon: Wallet, disponivel: true },
  { to: "/agenda", label: "Agenda", icon: Calendar, disponivel: true },
  { to: "/biblioteca", label: "Biblioteca", icon: BookOpen, disponivel: true },
  { to: "/ia", label: "Inteligência Artificial", icon: Sparkles, disponivel: false },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3, disponivel: true },
  { to: "/usuarios", label: "Usuários", icon: Users, disponivel: true },
  {
    to: "/configuracoes",
    label: "Configurações",
    icon: Settings,
    disponivel: true,
    permissao: "auditoria:read",
  },
]

export function AppLayout() {
  const { usuario, logout, temPermissao } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)
  const itensVisiveis = itensNavegacao.filter((item) => !item.permissao || temPermissao(item.permissao))

  function fecharMenu() {
    setMenuAberto(false)
  }

  return (
    <div className="flex min-h-svh">
      {/* Overlay do drawer no mobile */}
      {menuAberto && (
        <div
          onClick={fecharMenu}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 z-50 flex w-64 shrink-0 flex-col border-r border-border bg-primary text-primary-foreground transition-[left] duration-200 lg:static",
          menuAberto ? "left-0" : "-left-64",
        )}
      >
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <p className="text-lg font-semibold tracking-tight">Perito OS</p>
            <p className="text-xs text-primary-foreground/70">Gestão da atividade pericial</p>
          </div>
          <button
            onClick={fecharMenu}
            aria-label="Fechar menu"
            className="rounded-md p-1 text-primary-foreground/80 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {itensVisiveis.map(({ to, label, icon: Icon, disponivel }) =>
            disponivel ? (
              <NavLink
                key={to}
                to={to}
                onClick={fecharMenu}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-white/15 text-white"
                      : "text-primary-foreground/80 hover:bg-white/10 hover:text-white",
                  )
                }
              >
                <Icon className="size-4" />
                {label}
              </NavLink>
            ) : (
              <div
                key={to}
                title="Disponível em uma próxima fase"
                className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/40"
              >
                <Icon className="size-4" />
                {label}
              </div>
            ),
          )}
        </nav>
        <div className="border-t border-white/10 px-3 py-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-primary-foreground/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-4" />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-2 border-b border-border bg-card px-4 sm:gap-3 sm:px-6">
          <button
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          >
            <Menu className="size-5" />
          </button>

          <BuscaGlobal />

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <BotaoTema />
            <div className="hidden items-center gap-3 text-sm sm:flex">
              <span className="font-medium text-foreground">{usuario?.nome}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {usuario?.perfil.nome}
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 bg-background p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
