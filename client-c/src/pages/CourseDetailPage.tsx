import { useCallback, useEffect, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Link,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'

import { Breadcrumbs } from '@/components/Breadcrumbs'
import { PageHeading } from '@/components/PageHeading'
import { PageShell, ShellRow } from '@/lib/layout'
import { useAuth } from '@/contexts/auth-context'
import { api } from '@/lib/api'
import * as storage from '@/lib/auth-storage'
import type { Course } from '@/types/course'
import type { Enrollment } from '@/types/enrollment'

/** Matches server enrollment profile rules — lists what is still missing. */
function studentProfileIncompleteHint(user: {
  name: string | null
  phone: string | null
  aadhaarNumber: string | null
  studentRank: number | null
}): string {
  const missing: string[] = []
  if ((user.name?.trim() ?? '').length === 0) missing.push('name')
  if ((user.phone?.trim() ?? '').length === 0) missing.push('phone')
  const aadhaarDigits = (user.aadhaarNumber ?? '').replace(/\D/g, '')
  if (aadhaarDigits.length !== 12) missing.push('12-digit Aadhaar')
  if (user.studentRank == null || !Number.isFinite(user.studentRank) || user.studentRank <= 0) {
    missing.push('rank')
  }
  if (missing.length === 0) return 'Complete your profile'
  return `Add ${missing.join(', ')}`
}

function statusChipColor(
  s: Enrollment['status'],
): 'success' | 'warning' | 'error' | 'default' {
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

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, loading: authLoading } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mine, setMine] = useState<Enrollment[] | null>(null)
  const [enrollError, setEnrollError] = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState(false)

  const token = storage.getToken() ?? ''
  const courseIdNum = id ? Number(id) : NaN

  const refreshMine = useCallback(async () => {
    if (!token || user?.role !== 'student' || !Number.isFinite(courseIdNum)) {
      setMine([])
      return
    }
    try {
      const list = await api.get<Enrollment[]>('/enrollments/mine', token)
      setMine(list)
    } catch {
      setMine([])
    }
  }, [token, user?.role, courseIdNum])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void (async () => {
      try {
        const c = await api.getPublic<Course>(`/courses/${id}`)
        if (!cancelled) setCourse(c)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load course')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (authLoading) return
    void refreshMine()
  }, [authLoading, refreshMine])

  async function handleEnroll() {
    if (!Number.isFinite(courseIdNum)) return
    setEnrollError(null)
    setEnrolling(true)
    try {
      await api.postJson<Enrollment>('/enrollments', { courseId: courseIdNum }, token)
      await refreshMine()
    } catch (e) {
      setEnrollError(e instanceof Error ? e.message : 'Could not enroll')
    } finally {
      setEnrolling(false)
    }
  }

  const myEnrollment =
    mine && Number.isFinite(courseIdNum) ? mine.find((e) => e.courseId === courseIdNum) : undefined

  if (!id) {
    return (
      <ShellRow>
        <Typography variant="body2" color="error" sx={{ py: 3 }}>
          Invalid course.
        </Typography>
      </ShellRow>
    )
  }

  return (
    <PageShell>
      {error ? (
        <>
          <Breadcrumbs
            items={[
              { label: 'Home', to: '/' },
              { label: 'Courses', to: '/courses' },
              { label: 'Course' },
            ]}
          />
          <Typography variant="body2" color="error" role="alert">
            {error}
          </Typography>
        </>
      ) : !course ? (
        <>
          <Breadcrumbs
            items={[
              { label: 'Home', to: '/' },
              { label: 'Courses', to: '/courses' },
              { label: 'Loading…' },
            ]}
          />
          <Stack spacing={2} aria-busy="true" aria-label="Loading course">
            <Skeleton variant="text" width="100%" sx={{ maxWidth: 480 }} height={40} />
            <Skeleton variant="text" width={120} />
            <Card variant="outlined">
              <CardHeader title={<Skeleton width={160} />} subheader={<Skeleton width={80} />} />
              <CardContent>
                <Skeleton />
                <Skeleton />
                <Skeleton width="66%" />
              </CardContent>
            </Card>
          </Stack>
        </>
      ) : (
        <>
          <Breadcrumbs
            items={[
              { label: 'Home', to: '/' },
              { label: 'Courses', to: '/courses' },
              { label: course.code },
            ]}
          />
          <PageHeading
            title={`${course.code} — ${course.title}`}
            description={`${course.credits} credits · capacity ${course.capacity}`}
          />

          <Card variant="outlined">
            <CardHeader title="Description" subheader="Overview" />
            <CardContent>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {course.description}
              </Typography>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardHeader title="Prerequisites" subheader="Courses to complete before enrolling" />
            <CardContent>
              {course.prerequisites.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  None listed.
                </Typography>
              ) : (
                <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                  {course.prerequisites.map((p) => (
                    <li key={p.id}>
                      <Link component={RouterLink} to={`/courses/${p.id}`} underline="hover">
                        {p.code} — {p.title}
                      </Link>
                    </li>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardHeader title="Enrollment" subheader="Request access to this course (requires approved prerequisites)." />
            <CardContent>
              <Stack spacing={2}>
                {authLoading ? (
                  <Typography variant="body2" color="text.secondary">
                    Checking session…
                  </Typography>
                ) : !user ? (
                  <Typography variant="body2" color="text.secondary">
                    <Link component={RouterLink} to="/login" underline="hover">
                      Sign in
                    </Link>{' '}
                    as a student to request enrollment.
                  </Typography>
                ) : user.role === 'admin' ? (
                  <Typography variant="body2" color="text.secondary">
                    Administrators manage enrollments from the admin area.
                  </Typography>
                ) : user.role === 'student' && !user.profileComplete ? (
                  <Stack spacing={2}>
                    <Alert severity="warning">
                      {studentProfileIncompleteHint(user)} on{' '}
                      <Link component={RouterLink} to="/account" underline="hover">
                        Account
                      </Link>{' '}
                      before you can request enrollment.
                    </Alert>
                    {mine === null ? (
                      <Typography variant="body2" color="text.secondary">
                        Loading enrollment status…
                      </Typography>
                    ) : (
                      <>
                        {myEnrollment ? (
                          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                            <Typography variant="body2">Your status:</Typography>
                            <Chip
                              label={myEnrollment.status}
                              size="small"
                              color={statusChipColor(myEnrollment.status)}
                            />
                          </Stack>
                        ) : null}
                        {myEnrollment &&
                        (myEnrollment.status === 'PENDING' || myEnrollment.status === 'APPROVED') ? (
                          <Typography variant="caption" color="text.secondary">
                            To cancel, use{' '}
                            <Link component={RouterLink} to="/enrollments" underline="hover">
                              My enrollments
                            </Link>
                            .
                          </Typography>
                        ) : null}
                      </>
                    )}
                  </Stack>
                ) : mine === null ? (
                  <Typography variant="body2" color="text.secondary">
                    Loading enrollment status…
                  </Typography>
                ) : (
                  <>
                    {myEnrollment ? (
                      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                        <Typography variant="body2">Your status:</Typography>
                        <Chip label={myEnrollment.status} size="small" color={statusChipColor(myEnrollment.status)} />
                      </Stack>
                    ) : null}
                    {myEnrollment && (myEnrollment.status === 'REJECTED' || myEnrollment.status === 'CANCELLED') ? (
                      <Button type="button" variant="contained" onClick={() => void handleEnroll()} disabled={enrolling}>
                        {enrolling ? 'Submitting…' : 'Request again'}
                      </Button>
                    ) : null}
                    {!myEnrollment ? (
                      <Button type="button" variant="contained" onClick={() => void handleEnroll()} disabled={enrolling}>
                        {enrolling ? 'Submitting…' : 'Request enrollment'}
                      </Button>
                    ) : null}
                    {myEnrollment && (myEnrollment.status === 'PENDING' || myEnrollment.status === 'APPROVED') ? (
                      <Typography variant="caption" color="text.secondary">
                        To cancel, use{' '}
                        <Link component={RouterLink} to="/enrollments" underline="hover">
                          My enrollments
                        </Link>
                        .
                      </Typography>
                    ) : null}
                    {enrollError ? (
                      <Typography variant="body2" color="error">
                        {enrollError}
                      </Typography>
                    ) : null}
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        </>
      )}
    </PageShell>
  )
}
