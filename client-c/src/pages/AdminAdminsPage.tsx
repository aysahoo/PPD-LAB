import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'

import { PageHeading } from '@/components/PageHeading'
import { PageShell } from '@/lib/layout'
import { api } from '@/lib/api'
import * as storage from '@/lib/auth-storage'
import { useAuth } from '@/contexts/auth-context'

type AdminRow = {
  id: number
  name: string | null
  email: string
  phone: string | null
  role: string
  isActive: boolean
}

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().max(100).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
})

type CreateValues = z.infer<typeof createSchema>

export function AdminAdminsPage() {
  const { user, refreshUser } = useAuth()
  const [rows, setRows] = useState<AdminRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const token = storage.getToken() ?? ''

  const refresh = useCallback(async () => {
    const list = await api.get<AdminRow[]>('/admin/admins', token)
    setRows(list)
  }, [token])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        await refresh()
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load admins')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refresh])

  const form = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { email: '', password: '', name: '', phone: '' },
  })

  const onCreate = form.handleSubmit(async (data) => {
    setError(null)
    try {
      await api.postJson<AdminRow>(
        '/admin/admins',
        {
          email: data.email,
          password: data.password,
          name: data.name || undefined,
          phone: data.phone || undefined,
        },
        token,
      )
      setOpen(false)
      form.reset({ email: '', password: '', name: '', phone: '' })
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed')
    }
  })

  async function deactivate(id: number) {
    if (!window.confirm('Deactivate this admin?')) return
    setError(null)
    setBusyId(id)
    try {
      await api.delete(`/admin/admins/${id}`, token)
      await refresh()
      await refreshUser()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not deactivate')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <PageShell>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'flex-start' }}>
        <PageHeading title="Administrators" description="Create and manage admin accounts." />
        <Button type="button" variant="contained" onClick={() => setOpen(true)} sx={{ flexShrink: 0 }}>
          New admin
        </Button>
      </Stack>

      {error ? (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      ) : null}

      <Card variant="outlined">
        <CardHeader title="Accounts" subheader="You cannot deactivate yourself or the last active admin." />
        <CardContent>
          {rows === null ? (
            <Typography variant="body2" color="text.secondary">
              Loading…
            </Typography>
          ) : rows.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No admins.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell sx={{ fontWeight: 500 }}>{r.email}</TableCell>
                      <TableCell>{r.name ?? '—'}</TableCell>
                      <TableCell>
                        <Chip label={r.isActive ? 'active' : 'inactive'} size="small" variant={r.isActive ? 'filled' : 'outlined'} />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          type="button"
                          size="small"
                          color="error"
                          disabled={busyId === r.id || r.id === user?.id || !r.isActive}
                          onClick={() => void deactivate(r.id)}
                        >
                          Deactivate
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

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New administrator</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Creates an account with role admin.
          </Typography>
          <form id="admin-create-form" onSubmit={onCreate} noValidate>
            <TextField
              id="adm-email"
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              {...form.register('email')}
              error={!!form.formState.errors.email}
              helperText={form.formState.errors.email?.message}
            />
            <TextField
              id="adm-pass"
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              {...form.register('password')}
              error={!!form.formState.errors.password}
              helperText={form.formState.errors.password?.message}
            />
            <TextField id="adm-name" label="Name (optional)" fullWidth margin="normal" {...form.register('name')} />
            <TextField id="adm-phone" label="Phone (optional)" fullWidth margin="normal" {...form.register('phone')} />
          </form>
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="admin-create-form" variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  )
}
