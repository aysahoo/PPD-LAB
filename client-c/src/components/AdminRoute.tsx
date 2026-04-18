import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Typography } from '@mui/material'

import { FullScreenLoading } from '@/lib/layout'
import { useAuth } from '@/contexts/auth-context'

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <FullScreenLoading>
        <Typography variant="body2" color="text.secondary">
          Loading…
        </Typography>
      </FullScreenLoading>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}
