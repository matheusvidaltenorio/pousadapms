import { Navigate, useLocation } from 'react-router-dom'

/**
 * Protege rotas que exigem autenticação.
 * Se não houver token, redireciona para /login.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
