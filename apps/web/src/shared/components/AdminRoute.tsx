import { Navigate } from 'react-router-dom'

/**
 * Protege rotas que exigem role admin.
 * Redireciona para /dashboard se o usuário não for administrador.
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
