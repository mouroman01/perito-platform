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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/features/auth/auth-context"
import { BuscaGlobal } from "@/features/busca/busca-global"

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
  const itensVisiveis = itensNavegacao.filter((item) => !item.permissao || temPermissao(item.permissao))

  return (
    <div className="flex min-h-svh">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-primary text-primary-foreground">
        <div className="px-6 py-5">
          <p className="text-lg font-semibold tracking-tight">Perito OS</p>
          <p className="text-xs text-primary-foreground/70">Gestão da atividade pericial</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {itensVisiveis.map(({ to, label, icon: Icon, disponivel }) =>
            disponivel ? (
              <NavLink
                key={to}
                to={to}
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

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <BuscaGlobal />
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium text-foreground">{usuario?.nome}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {usuario?.perfil.nome}
            </span>
          </div>
        </header>
        <main className="flex-1 bg-background p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
