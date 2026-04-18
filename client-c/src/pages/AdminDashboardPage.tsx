import { useEffect, useState, type FormEvent } from 'react'
import { enqueueSnackbar } from 'notistack'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import { PageHeading } from '@/components/PageHeading'
import { maxWField, PageShell } from '@/lib/layout'
import { api } from '@/lib/api'
import { adminCreateNotification } from '@/lib/notifications-api'
import * as storage from '@/lib/auth-storage'

type Dashboard = {
  studentCount: number
  courseCount: number
  enrollmentCounts: {
    pending: number
    approved: number
    rejected: number
    cancelled: number
  }
}

export function AdminDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notifyUserId, setNotifyUserId] = useState('')
  const [notifyBody, setNotifyBody] = useState('')
  const [notifyBusy, setNotifyBusy] = useState(false)
  const token = storage.getToken() ?? ''

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const d = await api.get<Dashboard>('/admin/dashboard', token)
        if (!cancelled) setData(d)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load dashboard')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  async function sendNotification(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const uid = Number.parseInt(notifyUserId, 10)
    if (!Number.isFinite(uid) || uid < 1) {
      enqueueSnackbar('Enter a valid user ID', { variant: 'error' })
      return
    }
    if (!notifyBody.trim()) {
      enqueueSnackbar('Enter a message', { variant: 'error' })
      return
    }
    setNotifyBusy(true)
    try {
      await adminCreateNotification(token, { userId: uid, body: notifyBody.trim() })
      enqueueSnackbar('Notification sent', { variant: 'success' })
      setNotifyBody('')
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : 'Failed to send', { variant: 'error' })
    } finally {
      setNotifyBusy(false)
    }
  }

  return (
    <PageShell>
      <PageHeading title="Dashboard" description="Overview of students, courses, and enrollments." />

      {error ? (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      ) : null}

      {data === null ? (
        <Typography variant="body2" color="text.secondary">
          Loading…
        </Typography>
      ) : (
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardHeader title="Students" subheader="Active student accounts" />
              <CardContent>
                <Typography variant="h4" component="p" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                  {data.studentCount}
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardHeader title="Courses" subheader="Catalog size" />
              <CardContent>
                <Typography variant="h4" component="p" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                  {data.courseCount}
                </Typography>
              </CardContent>
            </Card>
          </Stack>

          <Card variant="outlined">
            <CardHeader title="Enrollments by status" />
            <CardContent>
              <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
                <li>
                  <Typography variant="body2" component="span">
                    Pending:{' '}
                    <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{data.enrollmentCounts.pending}</strong>
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" component="span">
                    Approved:{' '}
                    <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{data.enrollmentCounts.approved}</strong>
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" component="span">
                    Rejected:{' '}
                    <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{data.enrollmentCounts.rejected}</strong>
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" component="span">
                    Cancelled:{' '}
                    <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{data.enrollmentCounts.cancelled}</strong>
                  </Typography>
                </li>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardHeader title="Send notification" subheader="Deliver an in-app message to a user by their numeric ID (students and admins)." />
            <CardContent>
              <form onSubmit={(e) => void sendNotification(e)}>
                <Stack spacing={2} sx={{ maxWidth: maxWField }}>
                  <TextField
                    id="notify-user-id"
                    label="User ID"
                    type="number"
                    inputProps={{ min: 1, step: 1 }}
                    value={notifyUserId}
                    onChange={(e) => setNotifyUserId(e.target.value)}
                    placeholder="e.g. 1"
                    fullWidth
                  />
                  <TextField
                    id="notify-body"
                    label="Message"
                    value={notifyBody}
                    onChange={(e) => setNotifyBody(e.target.value)}
                    multiline
                    rows={3}
                    placeholder="Short message shown in the notification center"
                    fullWidth
                  />
                  <Button type="submit" variant="contained" disabled={notifyBusy}>
                    {notifyBusy ? 'Sending…' : 'Send'}
                  </Button>
                </Stack>
              </form>
            </CardContent>
          </Card>
        </Stack>
      )}
    </PageShell>
  )
}
