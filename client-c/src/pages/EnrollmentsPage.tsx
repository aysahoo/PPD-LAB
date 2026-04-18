import { useCallback, useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Link,
  Stack,
  Typography,
} from '@mui/material'

import { Breadcrumbs } from '@/components/Breadcrumbs'
import { PageHeading } from '@/components/PageHeading'
import { breadcrumbPresets } from '@/lib/breadcrumb-presets'
import { PageLoadingCenter, PageShell, PageShellNarrow } from '@/lib/layout'
import { useAuth } from '@/contexts/auth-context'
import { api } from '@/lib/api'
import * as storage from '@/lib/auth-storage'
import type { Enrollment } from '@/types/enrollment'

function statusColor(s: Enrollment['status']): 'success' | 'warning' | 'error' | 'default' {
  switch (s) {
    case 'APPROVED':
      return 'success'
    case 'PENDING':
      return 'warning'
    case 'REJECTED':
      return 'error'
    default:
      return 'default'
  }
}

function EnrollmentsContent() {
  const { user, loading } = useAuth()
  const [rows, setRows] = useState<Enrollment[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const token = storage.getToken() ?? ''

  const refresh = useCallback(async () => {
    if (!token || user?.role !== 'student') return
    const list = await api.get<Enrollment[]>('/enrollments/mine', token)
    setRows(list)
  }, [token, user?.role])

  useEffect(() => {
    if (loading || !user || user.role !== 'student') return
    let cancelled = false
    void (async () => {
      try {
        await refresh()
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load enrollments')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loading, user, refresh])

  useEffect(() => {
    if (loading || !user || user.role !== 'student') return
    const POLL_MS = 15_000
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      void refresh().catch(() => {
        /* keep polling */
      })
    }, POLL_MS)
    return () => window.clearInterval(id)
  }, [loading, user, refresh])

  async function handleCancel(enrollmentId: number) {
    if (!window.confirm('Cancel this enrollment?')) return
    setError(null)
    try {
      await api.delete(`/enrollments/${enrollmentId}`, token)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not cancel')
    }
  }

  if (loading) {
    return <PageLoadingCenter />
  }

  if (!user) {
    return null
  }

  if (user.role === 'admin') {
    return (
      <PageShellNarrow>
        <Breadcrumbs items={breadcrumbPresets.enrollments} />
        <Card variant="outlined">
          <CardHeader title="Student enrollments" />
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Your account is an administrator. Use{' '}
              <Link component={RouterLink} to="/admin/enrollments" underline="hover">
                Admin — Enrollments
              </Link>{' '}
              to approve or reject requests.
            </Typography>
          </CardContent>
        </Card>
      </PageShellNarrow>
    )
  }

  return (
    <PageShell>
      <Stack spacing={2}>
        <Breadcrumbs items={breadcrumbPresets.enrollments} />
        <PageHeading
          title="My enrollments"
          description="Status for each course you requested. You can cancel pending or approved requests here."
        />
      </Stack>

      {error ? (
        <Typography variant="body2" color="error" role="alert">
          {error}
        </Typography>
      ) : null}

      {rows === null ? (
        <Typography variant="body2" color="text.secondary">
          Loading…
        </Typography>
      ) : rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No enrollments yet.{' '}
          <Link component={RouterLink} to="/courses" underline="hover">
            Browse courses
          </Link>
          .
        </Typography>
      ) : (
        <Stack component="ul" spacing={2} sx={{ m: 0, p: 0, listStyle: 'none' }}>
          {rows.map((e) => (
            <Box component="li" key={e.id}>
              <Card variant="outlined">
                <CardHeader
                  title={
                    <Link component={RouterLink} to={`/courses/${e.courseId}`} underline="hover" color="inherit">
                      {e.course.code} — {e.course.title}
                    </Link>
                  }
                  subheader={`Requested ${new Date(e.createdAt).toLocaleString()}`}
                  action={<Chip label={e.status} size="small" color={statusColor(e.status)} />}
                  sx={{ '& .MuiCardHeader-action': { alignSelf: 'flex-start', mt: 0.5 } }}
                />
                {(e.status === 'PENDING' || e.status === 'APPROVED') && (
                  <CardContent sx={{ pt: 0 }}>
                    <Button type="button" variant="outlined" size="small" onClick={() => void handleCancel(e.id)}>
                      Cancel enrollment
                    </Button>
                  </CardContent>
                )}
              </Card>
            </Box>
          ))}
        </Stack>
      )}
    </PageShell>
  )
}

export function EnrollmentsPage() {
  return <EnrollmentsContent />
}
