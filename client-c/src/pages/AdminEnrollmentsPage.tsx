import { useCallback, useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { enqueueSnackbar } from 'notistack'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

import { PageHeading } from '@/components/PageHeading'
import { PageShell } from '@/lib/layout'
import { api } from '@/lib/api'
import * as storage from '@/lib/auth-storage'
import type { Enrollment } from '@/types/enrollment'

function AdminEnrollmentsContent() {
  const [rows, setRows] = useState<Enrollment[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const token = storage.getToken() ?? ''

  const refresh = useCallback(async () => {
    const list = await api.get<Enrollment[]>('/enrollments', token)
    setRows(list)
  }, [token])

  useEffect(() => {
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
  }, [refresh])

  async function approve(id: number) {
    setError(null)
    setBusyId(id)
    try {
      await api.putJson<Enrollment>(`/enrollments/${id}/approve`, {}, token)
      enqueueSnackbar('Enrollment approved', { variant: 'success' })
      await refresh()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Approve failed'
      setError(msg)
      enqueueSnackbar(msg, { variant: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  async function reject(id: number) {
    setError(null)
    setBusyId(id)
    try {
      await api.putJson<Enrollment>(`/enrollments/${id}/reject`, {}, token)
      enqueueSnackbar('Enrollment rejected', { variant: 'success' })
      await refresh()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Reject failed'
      setError(msg)
      enqueueSnackbar(msg, { variant: 'error' })
    } finally {
      setBusyId(null)
    }
  }

  const pending = rows?.filter((e) => e.status === 'PENDING') ?? []

  return (
    <PageShell>
      <PageHeading
        title="Enrollments"
        description="Approve or reject pending requests. Capacity is enforced on approve."
      />

      {error ? (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      ) : null}

      <Card variant="outlined">
        <CardHeader
          title="Pending queue"
          subheader={
            pending.length === 0 && rows !== null ? 'No pending enrollments.' : 'Students waiting for approval'
          }
        />
        <CardContent>
          {rows === null ? (
            <Typography variant="body2" color="text.secondary">
              Loading…
            </Typography>
          ) : pending.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              —
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pending.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {e.student.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {e.student.name ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Link component={RouterLink} to={`/courses/${e.courseId}`} variant="body2" underline="hover">
                          {e.course.code} — {e.course.title}
                        </Link>
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" disabled={busyId === e.id} onClick={() => void approve(e.id)} sx={{ mr: 1 }}>
                          Approve
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          disabled={busyId === e.id}
                          onClick={() => void reject(e.id)}
                        >
                          Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader title="All enrollments" subheader="Full list with status" />
        <CardContent>
          {rows === null ? null : rows.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              None yet.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <Typography variant="body2">{e.student.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {e.course.code} — {e.course.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={e.status} size="small" variant="outlined" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </PageShell>
  )
}

export function AdminEnrollmentsPage() {
  return <AdminEnrollmentsContent />
}
