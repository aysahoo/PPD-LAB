import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { BookOpen, Search } from 'lucide-react'
import {
  Box,
  Card,
  CardContent,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import { Breadcrumbs } from '@/components/Breadcrumbs'
import { PageHeading } from '@/components/PageHeading'
import { breadcrumbPresets } from '@/lib/breadcrumb-presets'
import { PageShell, maxWField } from '@/lib/layout'
import { api } from '@/lib/api'
import type { Course } from '@/types/course'

function CourseListSkeleton() {
  return (
    <Stack spacing={2} aria-hidden>
      {['a', 'b', 'c'].map((k) => (
        <Card key={k} variant="outlined">
          <CardContent>
            <Box sx={{ height: 20, bgcolor: 'action.hover', borderRadius: 1, maxWidth: '75%', mb: 1 }} />
            <Box sx={{ height: 16, bgcolor: 'action.hover', borderRadius: 1, maxWidth: 96, mb: 1 }} />
            <Box sx={{ height: 16, bgcolor: 'action.hover', borderRadius: 1, maxWidth: 112 }} />
          </CardContent>
        </Card>
      ))}
    </Stack>
  )
}

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const list = await api.getPublic<Course[]>('/courses')
        if (!cancelled) setCourses(list)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load courses')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    if (!courses) return []
    const q = query.trim().toLowerCase()
    if (!q) return courses
    return courses.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    )
  }, [courses, query])

  return (
    <PageShell>
      <Stack spacing={2}>
        <Breadcrumbs items={breadcrumbPresets.courses} />
        <PageHeading
          title="Course catalog"
          description="Browse open courses. Sign in to request enrollment — no account needed to browse."
        />
      </Stack>

      <Stack spacing={1}>
        <Typography component="label" htmlFor="course-search" variant="body2" fontWeight={500}>
          Search courses
        </Typography>
        <TextField
          id="course-search"
          type="search"
          name="search"
          placeholder="Search by code or title…"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ maxWidth: maxWField }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} aria-hidden />
                </InputAdornment>
              ),
            },
          }}
        />
        {courses && courses.length > 0 ? (
          <Typography variant="caption" color="text.secondary" aria-live="polite">
            {filtered.length === courses.length
              ? `${courses.length} course${courses.length === 1 ? '' : 's'}`
              : `${filtered.length} of ${courses.length} courses match`}
          </Typography>
        ) : null}
      </Stack>

      {error ? (
        <Typography variant="body2" color="error" role="alert">
          {error}
        </Typography>
      ) : courses === null ? (
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Loading catalog…
          </Typography>
          <CourseListSkeleton />
        </Stack>
      ) : courses.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            border: '1px dashed',
            borderColor: 'divider',
            borderRadius: 2,
            px: 4,
            py: 6,
            textAlign: 'center',
          }}
        >
          <BookOpen size={40} aria-hidden style={{ opacity: 0.5 }} />
          <Stack spacing={0.5}>
            <Typography fontWeight={500}>No courses yet</Typography>
            <Typography variant="body2" color="text.secondary">
              Check back later — administrators will publish courses here.
            </Typography>
          </Stack>
        </Box>
      ) : filtered.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No courses match “{query.trim()}”. Try another search.
        </Typography>
      ) : (
        <Stack component="ul" spacing={2} sx={{ m: 0, p: 0, listStyle: 'none' }}>
          {filtered.map((c) => (
            <Box component="li" key={c.id}>
              <Card
                component={RouterLink}
                to={`/courses/${c.id}`}
                variant="outlined"
                sx={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'block',
                  transition: 'background-color 0.15s',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <CardContent>
                  <Typography variant="h6" component="h2" sx={{ fontSize: '1.05rem', fontWeight: 600 }}>
                    {c.code} — {c.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {c.credits} credits · capacity {c.capacity}
                  </Typography>
                  <Link component="span" variant="body2" color="primary" sx={{ mt: 0.5, display: 'inline-block' }}>
                    View details →
                  </Link>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Stack>
      )}
    </PageShell>
  )
}
