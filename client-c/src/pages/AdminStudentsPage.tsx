import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  Chip,
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

type StudentRow = {
  id: number
  name: string | null
  email: string
  phone: string | null
  role: string
  isActive: boolean
}

export function AdminStudentsPage() {
  const [rows, setRows] = useState<StudentRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const token = storage.getToken() ?? ''

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const list = await api.get<StudentRow[]>('/admin/students', token)
        if (!cancelled) setRows(list)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load students')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <PageShell>
      <PageHeading title="Students" description="All student accounts." />

      {error ? (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      ) : null}

      <Card variant="outlined">
        <CardHeader title="Directory" subheader="From GET /admin/students" />
        <CardContent>
          {rows === null ? (
            <Typography variant="body2" color="text.secondary">
              Loading…
            </Typography>
          ) : rows.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No students yet.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell sx={{ fontWeight: 500 }}>{r.email}</TableCell>
                      <TableCell>{r.name ?? '—'}</TableCell>
                      <TableCell>{r.phone ?? '—'}</TableCell>
                      <TableCell>
                        <Chip
                          label={r.isActive ? 'active' : 'inactive'}
                          size="small"
                          color={r.isActive ? 'default' : 'default'}
                          variant={r.isActive ? 'filled' : 'outlined'}
                        />
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
