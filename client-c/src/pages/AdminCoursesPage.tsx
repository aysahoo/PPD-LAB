import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
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
import type { Course, PrerequisiteSummary } from '@/types/course'

const courseFormSchema = z.object({
  code: z.string().min(1, 'Required').max(32),
  title: z.string().min(1, 'Required').max(200),
  description: z.string(),
  credits: z.coerce.number().int().positive(),
  capacity: z.coerce.number().int().positive(),
})

type CourseFormValues = z.infer<typeof courseFormSchema>

function AdminCoursesContent() {
  const [rows, setRows] = useState<Course[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [prereqForId, setPrereqForId] = useState<number | null>(null)
  const [detail, setDetail] = useState<Course | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [addPrereqId, setAddPrereqId] = useState<string>('')

  const token = storage.getToken() ?? ''

  const refreshList = useCallback(async () => {
    const list = await api.getPublic<Course[]>('/courses')
    setRows(list)
  }, [])

  useEffect(() => {
    void (async () => {
      try {
        await refreshList()
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Failed to load courses')
      }
    })()
  }, [refreshList])

  const createForm = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: { code: '', title: '', description: '', credits: 3, capacity: 30 },
  })

  const editForm = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: { code: '', title: '', description: '', credits: 3, capacity: 1 },
  })

  useEffect(() => {
    if (editId === null) return
    let cancelled = false
    void (async () => {
      setDetailLoading(true)
      setActionError(null)
      try {
        const c = await api.getPublic<Course>(`/courses/${editId}`)
        if (cancelled) return
        setDetail(c)
        editForm.reset({
          code: c.code,
          title: c.title,
          description: c.description,
          credits: c.credits,
          capacity: c.capacity,
        })
      } catch (e) {
        if (!cancelled) {
          setActionError(e instanceof Error ? e.message : 'Failed to load course')
        }
      } finally {
        if (!cancelled) setDetailLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [editId, editForm])

  useEffect(() => {
    if (prereqForId === null) return
    let cancelled = false
    void (async () => {
      setDetailLoading(true)
      setActionError(null)
      try {
        const c = await api.getPublic<Course>(`/courses/${prereqForId}`)
        if (!cancelled) {
          setDetail(c)
          setAddPrereqId('')
        }
      } catch (e) {
        if (!cancelled) {
          setActionError(e instanceof Error ? e.message : 'Failed to load course')
        }
      } finally {
        if (!cancelled) setDetailLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [prereqForId])

  const onCreate = createForm.handleSubmit(async (data) => {
    setActionError(null)
    try {
      await api.postJson<Course>('/courses', data, token)
      setCreateOpen(false)
      createForm.reset({ code: '', title: '', description: '', credits: 3, capacity: 30 })
      await refreshList()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Create failed')
    }
  })

  const onEdit = editForm.handleSubmit(async (data) => {
    if (editId === null) return
    setActionError(null)
    try {
      await api.putJson<Course>(`/courses/${editId}`, data, token)
      setEditId(null)
      await refreshList()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Update failed')
    }
  })

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this course? Prerequisites are removed automatically.')) return
    setActionError(null)
    try {
      await api.delete<{ message: string }>(`/courses/${id}`, token)
      await refreshList()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  async function handleAddPrerequisite() {
    if (prereqForId === null || !addPrereqId) return
    const prerequisiteCourseId = Number(addPrereqId)
    setActionError(null)
    try {
      await api.postJson(`/courses/${prereqForId}/prerequisites`, { prerequisiteCourseId }, token)
      const c = await api.getPublic<Course>(`/courses/${prereqForId}`)
      setDetail(c)
      setAddPrereqId('')
      await refreshList()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not add prerequisite')
    }
  }

  async function handleRemovePrerequisite(prereq: PrerequisiteSummary) {
    if (prereqForId === null) return
    setActionError(null)
    try {
      await api.delete<{ message: string }>(`/courses/${prereqForId}/prerequisites/${prereq.id}`, token)
      const c = await api.getPublic<Course>(`/courses/${prereqForId}`)
      setDetail(c)
      await refreshList()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not remove prerequisite')
    }
  }

  const candidatePrereqs: { id: number; code: string; title: string }[] =
    rows && detail && prereqForId !== null
      ? rows.filter((r) => r.id !== prereqForId && !detail.prerequisites.some((p) => p.id === r.id))
      : []

  return (
    <PageShell>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'flex-start' }}>
        <PageHeading title="Courses" description="Create, edit, and link prerequisites." />
        <Button type="button" variant="contained" onClick={() => setCreateOpen(true)} sx={{ flexShrink: 0 }}>
          New course
        </Button>
      </Stack>

      {loadError ? (
        <Typography variant="body2" color="error">
          {loadError}
        </Typography>
      ) : null}
      {actionError ? (
        <Typography variant="body2" color="error">
          {actionError}
        </Typography>
      ) : null}

      <Card variant="outlined">
        <CardHeader title="Catalog" subheader="All courses in the database" />
        <CardContent>
          {rows === null ? (
            <Typography variant="body2" color="text.secondary">
              Loading…
            </Typography>
          ) : rows.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No courses yet.
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell align="right">Credits</TableCell>
                    <TableCell align="right">Capacity</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell sx={{ fontWeight: 500 }}>{r.code}</TableCell>
                      <TableCell>{r.title}</TableCell>
                      <TableCell align="right">{r.credits}</TableCell>
                      <TableCell align="right">{r.capacity}</TableCell>
                      <TableCell align="right">
                        <Button size="small" variant="outlined" sx={{ mr: 1 }} onClick={() => setEditId(r.id)}>
                          Edit
                        </Button>
                        <Button size="small" variant="outlined" sx={{ mr: 1 }} onClick={() => setPrereqForId(r.id)}>
                          Prerequisites
                        </Button>
                        <Button size="small" color="error" onClick={() => void handleDelete(r.id)}>
                          Delete
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

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New course</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add a row to the catalog.
          </Typography>
          <form id="course-create-form" onSubmit={onCreate} noValidate>
            <TextField
              id="create-code"
              label="Code"
              fullWidth
              margin="normal"
              {...createForm.register('code')}
              error={!!createForm.formState.errors.code}
              helperText={createForm.formState.errors.code?.message}
            />
            <TextField
              id="create-title"
              label="Title"
              fullWidth
              margin="normal"
              {...createForm.register('title')}
              error={!!createForm.formState.errors.title}
              helperText={createForm.formState.errors.title?.message}
            />
            <TextField id="create-desc" label="Description" fullWidth margin="normal" multiline rows={4} {...createForm.register('description')} />
            <TextField
              id="create-credits"
              label="Credits"
              type="number"
              fullWidth
              margin="normal"
              inputProps={{ min: 1 }}
              {...createForm.register('credits')}
              error={!!createForm.formState.errors.credits}
              helperText={createForm.formState.errors.credits?.message}
            />
            <TextField
              id="create-cap"
              label="Capacity"
              type="number"
              fullWidth
              margin="normal"
              inputProps={{ min: 1 }}
              {...createForm.register('capacity')}
              error={!!createForm.formState.errors.capacity}
              helperText={createForm.formState.errors.capacity?.message}
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={() => setCreateOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="course-create-form" variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editId !== null} onClose={() => setEditId(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit course</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Update fields and save.
          </Typography>
          {detailLoading || !detail || editId === null ? (
            <Typography variant="body2" color="text.secondary">
              Loading…
            </Typography>
          ) : (
            <form id="course-edit-form" onSubmit={onEdit} noValidate>
              <TextField
                id="edit-code"
                label="Code"
                fullWidth
                margin="normal"
                {...editForm.register('code')}
                error={!!editForm.formState.errors.code}
                helperText={editForm.formState.errors.code?.message}
              />
              <TextField
                id="edit-title"
                label="Title"
                fullWidth
                margin="normal"
                {...editForm.register('title')}
                error={!!editForm.formState.errors.title}
                helperText={editForm.formState.errors.title?.message}
              />
              <TextField id="edit-desc" label="Description" fullWidth margin="normal" multiline rows={4} {...editForm.register('description')} />
              <TextField
                id="edit-credits"
                label="Credits"
                type="number"
                fullWidth
                margin="normal"
                inputProps={{ min: 1 }}
                {...editForm.register('credits')}
                error={!!editForm.formState.errors.credits}
                helperText={editForm.formState.errors.credits?.message}
              />
              <TextField
                id="edit-cap"
                label="Capacity"
                type="number"
                fullWidth
                margin="normal"
                inputProps={{ min: 1 }}
                {...editForm.register('capacity')}
                error={!!editForm.formState.errors.capacity}
                helperText={editForm.formState.errors.capacity?.message}
              />
            </form>
          )}
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={() => setEditId(null)}>
            Cancel
          </Button>
          <Button type="submit" form="course-edit-form" variant="contained" disabled={detailLoading || !detail}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={prereqForId !== null} onClose={() => setPrereqForId(null)} fullWidth maxWidth="sm">
        <DialogTitle>Prerequisites</DialogTitle>
        <DialogContent>
          {detailLoading || !detail || prereqForId === null ? (
            <Typography variant="body2" color="text.secondary">
              Loading…
            </Typography>
          ) : (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                For <Chip size="small" label={detail.code} sx={{ verticalAlign: 'middle', mx: 0.5 }} /> — courses that
                must be satisfied first.
              </Typography>
              {detail.prerequisites.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No prerequisites yet.
                </Typography>
              ) : (
                <Stack component="ul" spacing={1} sx={{ m: 0, p: 0, listStyle: 'none' }}>
                  {detail.prerequisites.map((p) => (
                    <Box
                      component="li"
                      key={p.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        px: 1.5,
                        py: 1,
                      }}
                    >
                      <Typography variant="body2">
                        {p.code} — {p.title}
                      </Typography>
                      <Button size="small" onClick={() => void handleRemovePrerequisite(p)}>
                        Remove
                      </Button>
                    </Box>
                  ))}
                </Stack>
              )}
              <Typography variant="subtitle2">Add prerequisite</Typography>
              {candidatePrereqs.length === 0 ? (
                <Typography variant="caption" color="text.secondary">
                  No other courses available, or all are already linked.
                </Typography>
              ) : (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'flex-end' }}>
                  <FormControl fullWidth sx={{ minWidth: 220 }}>
                    <InputLabel id="prereq-select-label">Course</InputLabel>
                    <Select
                      labelId="prereq-select-label"
                      label="Course"
                      value={addPrereqId}
                      onChange={(e) => setAddPrereqId(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Choose a course</em>
                      </MenuItem>
                      {candidatePrereqs.map((c) => (
                        <MenuItem key={c.id} value={String(c.id)}>
                          {c.code} — {c.title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button type="button" variant="contained" onClick={() => void handleAddPrerequisite()} disabled={!addPrereqId}>
                    Add
                  </Button>
                </Stack>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button type="button" variant="outlined" onClick={() => setPrereqForId(null)}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  )
}

export function AdminCoursesPage() {
  return <AdminCoursesContent />
}
