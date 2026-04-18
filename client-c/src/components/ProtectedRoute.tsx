import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { PageLoadingCenter } from '@/lib/layout'
import { useAuth } from '@/contexts/auth-context'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <PageLoadingCenter />
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
