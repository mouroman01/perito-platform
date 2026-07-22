import { Suspense, lazy } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { AuthProvider } from "@/features/auth/auth-context"
import { LoginPage } from "@/features/auth/login-page"
import { EsqueciSenhaPage } from "@/features/auth/esqueci-senha-page"
import { RedefinirSenhaPage } from "@/features/auth/redefinir-senha-page"
import { DashboardPage } from "@/features/dashboard/dashboard-page"
import { UsuariosPage } from "@/features/usuarios/usuarios-page"
import { CrmLayout } from "@/features/crm/crm-layout"
import { ComarcasPage } from "@/features/crm/comarcas-page"
import { MagistradosPage } from "@/features/crm/magistrados-page"
import { EscritoriosPage } from "@/features/crm/escritorios-page"
import { AdvogadosPage } from "@/features/crm/advogados-page"
import { ContatosPage } from "@/features/crm/contatos-page"
import { ClientesPage } from "@/features/crm/clientes-page"
import { ProspeccaoPage } from "@/features/crm/prospeccao-page"
import { ProcessosPage } from "@/features/processos/processos-page"
import { ProcessoDetailPage } from "@/features/processos/processo-detail-page"
import { AgendaPage } from "@/features/agenda/agenda-page"
import { FinanceiroPage } from "@/features/financeiro/financeiro-page"
import { BibliotecaLayout } from "@/features/biblioteca/biblioteca-layout"
import { ModelosPage } from "@/features/biblioteca/modelos-page"
import { LaudosPage } from "@/features/laudos/laudos-page"
import { LaudoDetailPage } from "@/features/laudos/laudo-detail-page"
import { AuditoriaPage } from "@/features/configuracoes/auditoria-page"
import { ProtectedRoute } from "@/routes/protected-route"

const RelatoriosPage = lazy(() =>
  import("@/features/relatorios/relatorios-page").then((m) => ({ default: m.RelatoriosPage })),
)

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/esqueci-senha" element={<EsqueciSenhaPage />} />
        <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />

          <Route path="/crm" element={<CrmLayout />}>
            <Route index element={<Navigate to="prospeccao" replace />} />
            <Route path="prospeccao" element={<ProspeccaoPage />} />
            <Route path="clientes" element={<ClientesPage />} />
            <Route path="advogados" element={<AdvogadosPage />} />
            <Route path="escritorios" element={<EscritoriosPage />} />
            <Route path="contatos" element={<ContatosPage />} />
            <Route path="magistrados" element={<MagistradosPage />} />
            <Route path="comarcas" element={<ComarcasPage />} />
          </Route>

          <Route path="/processos" element={<ProcessosPage />} />
          <Route path="/processos/:id" element={<ProcessoDetailPage />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/financeiro" element={<FinanceiroPage />} />

          <Route path="/biblioteca" element={<BibliotecaLayout />}>
            <Route index element={<Navigate to="modelos" replace />} />
            <Route path="modelos" element={<ModelosPage />} />
            <Route path="laudos" element={<LaudosPage />} />
          </Route>
          <Route path="/laudos/:id" element={<LaudoDetailPage />} />
          <Route
            path="/relatorios"
            element={
              <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando...</p>}>
                <RelatoriosPage />
              </Suspense>
            }
          />
          <Route path="/configuracoes" element={<AuditoriaPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
