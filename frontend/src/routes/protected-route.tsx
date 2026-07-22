import { Navigate } from "react-router-dom"
import { useAuth } from "@/features/auth/auth-context"
import { AppLayout } from "@/components/layout/app-layout"

export function ProtectedRoute() {
  const { usuario, carregando } = useAuth()

  if (carregando) {
    return <div className="flex min-h-svh items-center justify-center text-muted-foreground">Carregando...</div>
  }

  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  return <AppLayout />
}
