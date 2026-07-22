import { NavLink, Outlet } from "react-router-dom"
import { cn } from "@/lib/utils"

const abas = [
  { to: "/crm/prospeccao", label: "Prospecção" },
  { to: "/crm/clientes", label: "Clientes" },
  { to: "/crm/advogados", label: "Advogados" },
  { to: "/crm/escritorios", label: "Escritórios" },
  { to: "/crm/contatos", label: "Contatos" },
  { to: "/crm/magistrados", label: "Magistrados" },
  { to: "/crm/comarcas", label: "Comarcas" },
]

export function CrmLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">CRM</h1>
        <p className="text-sm text-muted-foreground">
          Clientes, advogados, escritórios, contatos, magistrados, comarcas e funil de prospecção.
        </p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {abas.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )
            }
          >
            {label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  )
}
