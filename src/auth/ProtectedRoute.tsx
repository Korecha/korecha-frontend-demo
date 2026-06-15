import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { Loading } from '../components/ui/Loading'
import type { UserRole } from '../types'

export function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode
  roles?: UserRole[]
}) {
  const { user, loading } = useAuth()

  if (loading) return <Loading message="Authenticating..." />

  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />

  return <>{children}</>
}
