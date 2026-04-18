import { useNavigate } from 'react-router-dom'
import { Button, Stack, Typography } from '@mui/material'

import { PageShell } from '@/lib/layout'
import { useAuth } from '@/contexts/auth-context'

/** Minimal landing: left-aligned column — workspace C (MUI). */
export function HomePage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  return (
    <PageShell>
      <Stack spacing={2} alignItems="flex-start" sx={{ maxWidth: 520 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          PPD Lab · workspace C
        </Typography>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
          Courses and enrollment requests
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          Browse the catalog without signing in. When you are ready, log in to request a seat and check status on your
          enrollments.
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 0.5 }}>
          <Button variant="contained" color="primary" onClick={() => navigate('/courses')}>
            View catalog
          </Button>
          {!loading && !user ? (
            <Button variant="outlined" color="inherit" onClick={() => navigate('/register')}>
              Register
            </Button>
          ) : null}
          {!loading && user?.role === 'student' ? (
            <Button variant="outlined" color="inherit" onClick={() => navigate('/enrollments')}>
              My enrollments
            </Button>
          ) : null}
          {!loading && user?.role === 'admin' ? (
            <Button variant="outlined" color="inherit" onClick={() => navigate('/admin/dashboard')}>
              Admin
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </PageShell>
  )
}
