import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
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

type ReportRow = { key: string; value: number }

export function AdminReportsPage() {
  const [enrollments, setEnrollments] = useState<ReportRow[] | null>(null)
  const [students, setStudents] = useState<ReportRow[] | null>(null)
  const [courses, setCourses] = useState<ReportRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const token = storage.getToken() ?? ''

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [e, s, c] = await Promise.all([
          api.get<ReportRow[]>('/admin/reports/enrollments', token),
          api.get<ReportRow[]>('/admin/reports/students', token),
          api.get<ReportRow[]>('/admin/reports/courses', token),
        ])
        if (!cancelled) {
          setEnrollments(e)
          setStudents(s)
          setCourses(c)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load reports')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <PageShell>
      <PageHeading title="Reports" description="Aggregated metrics from the API." />

      {error ? (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      ) : null}

      <Card variant="outlined">
        <CardHeader title="Enrollments" subheader="Counts by status" />
        <CardContent>
          {enrollments === null ? (
            <Typography variant="body2" color="text.secondary">
              Loading…
            </Typography>
          ) : (
            <ReportTable rows={enrollments} />
          )}
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader title="Students" subheader="Active vs inactive" />
        <CardContent>
          {students === null ? (
            <Typography variant="body2" color="text.secondary">
              Loading…
            </Typography>
          ) : (
            <ReportTable rows={students} />
          )}
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader title="Courses" subheader="Totals and approved enrollment counts per course" />
        <CardContent>
          {courses === null ? (
            <Typography variant="body2" color="text.secondary">
              Loading…
            </Typography>
          ) : (
            <ReportTable rows={courses} />
          )}
        </CardContent>
      </Card>
    </PageShell>
  )
}

function ReportTable({ rows }: { rows: ReportRow[] }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Key</TableCell>
            <TableCell align="right">Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.key}>
              <TableCell sx={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem' }}>{r.key}</TableCell>
              <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {r.value}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
