import { NavLink, Outlet } from "react-router-dom"
import { cn } from "@/lib/utils"

const abas = [
  { to: "/biblioteca/modelos", label: "Modelos" },
  { to: "/biblioteca/laudos", label: "Laudos" },
]

export function BibliotecaLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Biblioteca</h1>
        <p className="text-sm text-muted-foreground">Modelos de documentos e laudos periciais.</p>
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
